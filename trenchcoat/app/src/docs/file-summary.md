---
pattern: none
status: new
related: cited-answer, ai-answer, artifact-panel, dropzone
---

## Overview

What's in a file, without opening it. The header names the file, with an icon for its type and its size and length.
Below it, an AI summary streams in, followed by the key points – each citing the pages or times it comes from – and
the people, organisations, dates and amounts the file mentions, with how often. A line says how much of the file the
summary covers, and the footer says when it was summarised and by which model, with Copy, Regenerate and Open file.
Short and Detailed switch the summary's length.

The page drives it with `status`: "idle" offers Summarise, "summarising" shows a shimmer until the first words arrive
and a caret while the text grows, "done" shows everything, and "error" shows what went wrong with Retry. Stream by
setting `summary`, `points` and `entities` as they arrive.

## When to use

- A file someone uploaded or attached – a contract, a report, a recording – before they decide to read it all.
- A file list or inbox where each file can be summarised on request.
- Reviewing documents, where every claim should lead back to its page.

## When not to use

- An answer to a question, with its sources – use `cited-answer` or `ai-answer`.
- Files an agent produced, with versions to compare – use `artifact-panel`.
- Choosing files to upload – use `dropzone`.

## Anatomy

1. **File** `.tc-head` – the type's icon, the name, and the type, size and pages or duration
2. **Length** `.ui-fsum__len` – Short or Detailed
3. **Summary** `.ui-fsum__summary` – the paragraphs, with a caret while they stream in; a shimmer `.ui-fsum__skeleton` before the first words
4. **Key points** `.ui-fsum__points` – each point with its citation chips `.ui-fsum__cite`
5. **Mentions** `.ui-fsum__entities` – people & organisations, and dates & amounts, as chips with counts
6. **Coverage** `.ui-fsum__coverage` – how much of the file the summary covers
7. **Footer** `.ui-fsum__foot` – when and by which model, then Copy, Regenerate and Open file
8. **Error** `.ui-fsum__error` – what went wrong, with Retry

## Looks

Standard is a white card on a gray tray, with the file's header on the tray above it and a stronger selected length.
Clean is one white card with the header as its first row, roomier summary lines and thinner icons. The header icon
takes the file type's colour in both: red for PDF, green for spreadsheets, amber for slides, pink for images and
violet for audio and video.

## Keyboard

Every control is a stop in reading order: Short / Detailed (one stop), Summarise or Retry, each citation chip, each
mention, then Copy, Regenerate and Open file.

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves between the controls |
| ← / → / ↑ / ↓ | In Short / Detailed, picks the other length |
| Home / End | In Short / Detailed, picks Short or Detailed |
| Enter / Space | Uses the focused control: opens a citation, picks a mention, copies, regenerates |

While summarising, Copy and Regenerate are disabled; if focus was on a control that goes away or is disabled, it
moves to Short / Detailed. Picking a length while summarising fires tc-length-change, so the page can start again.

## Screen readers

The file's name is the card's heading. Short / Detailed is a `radiogroup` labelled “Summary length”. While the summary
streams, it is `aria-busy`; the status is announced politely: “Summarising Q3 report.pdf”, “Summary of Q3 report.pdf
ready”, or “Couldn't summarise Q3 report.pdf: …”. An error is also an `alert`. Key points and mentions are lists
headed “Key points”, “People & organisations” and “Dates & amounts”. A citation chip shows “p. 12” or “4:32” and reads “Open page
12” or “Open at 4 minutes 32 seconds”; a mention reads “Amara Diallo, mentioned 9 times”. Copy confirms with “Summary copied”.

## Content

- Keep the short summary to two or three sentences, and the detailed one to two short paragraphs.
- Write key points as findings, not topics: “Revenue up 18% to $42.6M”, not “Revenue”.
- Cite every key point; a point without a page or time can't be checked.
- Say what the summary missed in `coverage`: “Covers 46 of 48 pages · 2 pages of scanned charts unreadable”.
- Write `error` as what happened and what to do: “The model timed out. Large scanned files can take longer – try again.”

## Do

- Set `href` so Open file and the citation chips open the file at the right page or time; prevent `tc-cite-open` to
  jump inside your own viewer instead.
- Name the model and the time, so people can judge how fresh and how trustworthy the summary is.
- Summarise again on `tc-length-change` and `tc-retry`, setting `status` back to "summarising".

## Don't

- Don't summarise automatically on every file in a long list – offer Summarise and let people choose.
- Don't fill `points` with sentences from the summary – they should add the evidence the summary leaves out.
- Don't leave `status` at "summarising" after a failure – set "error" so Retry appears.

## Example

```html
<tc-file-summary id="sum" status="idle" model="Claude Sonnet" href="/files/q3-report.pdf"></tc-file-summary>

<script type="module">
  import "trenchcoat/file-summary";
  import "trenchcoat/tokens.css";

  const sum = document.querySelector("#sum");
  sum.file = { name: "Q3 report.pdf", kind: "pdf", size: 2516582, pages: 48 };
  sum.addEventListener("tc-summarise", async () => {
    sum.status = "summarising";
    const result = await fetch("/api/summarise?file=q3-report.pdf").then((r) => r.json());
    sum.summary = result.summary;
    sum.points = [{ id: "rev", text: "Revenue up 18% to $42.6M.", refs: [{ page: 4 }] }];
    sum.entities = [{ id: "nw", label: "Northwind Ltd", kind: "organization", count: 63 }];
    sum.summarisedAt = Date.now();
    sum.status = "done";
  });
</script>
```

```tsx
import { useState } from "react";
import { FileSummary, type FileSummaryStatus } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function ReportSummary() {
  const [status, setStatus] = useState<FileSummaryStatus>("idle");
  const [summary, setSummary] = useState("");
  const summarise = async () => {
    setStatus("summarising");
    const result = await fetch("/api/summarise?file=q3-report.pdf").then((r) => r.json());
    setSummary(result.summary);
    setStatus("done");
  };
  return (
    <FileSummary
      file={{ name: "Q3 report.pdf", kind: "pdf", size: 2516582, pages: 48 }}
      href="/files/q3-report.pdf"
      model="Claude Sonnet"
      status={status}
      summary={summary}
      points={[{ id: "rev", text: "Revenue up 18% to $42.6M.", refs: [{ page: 4 }] }]}
      onSummarise={summarise}
      onRetry={summarise}
    />
  );
}
```
