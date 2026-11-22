---
pattern: dialog
status: new
related: file-import, audit-trail, bulk-action-bar, dialog
---

## Overview

Exporting a list, in one modal. People pick the format – CSV, Excel or PDF – and which rows: the ones they've selected, the ones the filters show, or all of them, each with its count. A choice with nothing in it is disabled, with the reason beside it ("Nothing is selected"). They pick the columns – Select all and Select none, with required columns always included – and, when the page knows their address, "Email me at … when it's ready", which starts ticked when the rows go past `email-threshold` (5,000 by default).

Export fires `tc-export` with those choices, and the page does the work and drives `status`. "preparing" shows a progress bar (`progress` from 0 to 1, or a moving bar when it isn't known) and Cancel. "ready" shows the file's name and size with Download and Done. "emailed" says the file will be emailed. "failed" says what went wrong (`error`) with Retry, which sends the same request again. Each change is announced, and focus moves to the new state's main button.

It's a native modal: the page behind is inert, Escape, Close or a click outside close it, and focus goes back to the button that opened it.

## When to use

- Letting people take a list, table or record out of the app as a file.
- Exports big enough to take a while, where emailing the file beats waiting.

## When not to use

- Bringing a file in – use `file-import`.
- A history of who exported what – use `audit-trail`.
- A one-click action on the selected rows – put it in `bulk-action-bar`.

## Anatomy

1. **Panel** `.ui-exd__dialog` – the modal, with `.ui-exd__title` and `.ui-exd__close`
2. **Format** `.ui-exd__formats` – one `.ui-exd__format` per format, with its `.ui-exd__hint`
3. **Rows** `.ui-exd__rows` – one `.ui-exd__row` per choice, with its `.ui-exd__count`, or the reason it's disabled
4. **Columns** `.ui-exd__columns` – a `.ui-exd__column` checkbox each, under Select all and Select none (`.ui-exd__link`)
5. **Email me** `.ui-exd__email` – when `email` is set
6. **Progress** `.ui-exd__bar` – while preparing
7. **File** `.ui-exd__file` – when ready, above Download
8. **Footer** `.ui-exd__footer` – Cancel and Export, or the status's buttons, the main one `.ui-exd__primary`

## Looks

The panel is a card in both Standard and Clean, on a dimmed page. `--tc-exd-w` sets the panel's widest; it never goes past 94% of the window, and the formats and columns rewrap to fit.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the format, rows, columns, Email me and the buttons – focus stays in the dialog |
| Arrow keys | Move between formats, or between row choices |
| Space | Ticks or unticks a column or Email me |
| Escape | Closes the dialog; focus goes back to what opened it |

## Screen readers

The dialog is named by its heading and described by `description`. Format, Rows and Columns are fieldsets with legends; formats and rows are radio buttons, so their number and place are read. A disabled row choice is described by its reason. The progress bar is a `progressbar` with its percentage, or none while it's unknown. A polite status line says "Preparing your export…", "Your export is ready: <file>", that it'll be emailed, or why it failed. Download names the file.

## Content

- Name columns as they're named on screen.
- Mark only what an export can't be read without as `required` – usually the record's id.
- Keep `error` to what happened and whether anything was sent: "The export service took too long to answer. Nothing was sent."
- Give `fileName` with its extension, and `fileSize` in bytes.

## Do

- Pass the real counts, so a disabled choice says why.
- Send the export to the server and keep the dialog's `status` in step with it.
- Log `tc-export` if exports need auditing.

## Don't

- Don't offer Email me without knowing the address – leave `email` unset instead.
- Don't keep people waiting on a huge export with the dialog open – lower `email-threshold` instead.

## Example

```html
<button id="export-open" type="button">Export…</button>
<tc-export-dialog id="export" email="noor.haddad@ledgerline.example"></tc-export-dialog>

<script type="module">
  import "@adamstavely/trenchcoat/export-dialog";
  import "@adamstavely/trenchcoat/tokens.css";

  const dialog = document.querySelector("#export");
  dialog.counts = { selected: 12, filtered: 340, all: 12480 };
  dialog.columns = [
    { id: "case", label: "Case", required: true },
    { id: "reviewer", label: "Reviewer" },
    { id: "risk", label: "Risk score" },
  ];
  document.querySelector("#export-open").addEventListener("click", () => (dialog.open = true));
  dialog.addEventListener("tc-export", async (e) => {
    dialog.status = "preparing";
    const res = await fetch("/api/exports", { method: "POST", body: JSON.stringify(e.detail) });
    const job = await res.json();
    if (e.detail.emailMe) dialog.status = "emailed";
    else Object.assign(dialog, { status: "ready", downloadUrl: job.url, fileName: job.name, fileSize: job.size });
  });
</script>
```

```tsx
import { useState } from "react";
import { ExportDialog, type ExportRequest, type ExportStatus } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function ExportCases({ startExport }: { startExport: (r: ExportRequest) => Promise<{ url: string; name: string; size: number }> }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [file, setFile] = useState<{ url: string; name: string; size: number }>();
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Export…
      </button>
      <ExportDialog
        open={open}
        onOpenChange={setOpen}
        counts={{ selected: 12, filtered: 340, all: 12480 }}
        columns={[
          { id: "case", label: "Case", required: true },
          { id: "reviewer", label: "Reviewer" },
        ]}
        status={status}
        downloadUrl={file?.url}
        fileName={file?.name}
        fileSize={file?.size}
        onExport={async (request) => {
          setStatus("preparing");
          setFile(await startExport(request));
          setStatus("ready");
        }}
      />
    </>
  );
}
```
