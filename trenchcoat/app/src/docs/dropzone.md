---
pattern: none
status: stable
related: image-grid, context-tray, chat-composer, stepper-form
---

## Overview

An area to drag files onto, or click to choose them, that then shows every file uploading. Each file gets a row
with a coloured type badge, its size, the time left and its own progress bar; files of the wrong type or over the
size limit say why at once, a failed upload can be retried, and any row can be removed – which cancels its upload.
It is a form control: the added files are submitted under `name`, `required` asks for at least one, and a form
reset brings back the first list.

## When to use

- Uploading documents, images or data files as part of a task or a form.
- Batches of files, where people need to see what is still uploading and what failed.
- Anywhere people already have the files open on their desktop and will drag them in.

## When not to use

- Attaching a file to a chat message – use `chat-composer`.
- Showing the files and sources already in an agent's context – use `context-tray`.
- Browsing and comparing generated images – use `image-grid`.
- A file that is one step of a longer form – put the dropzone in a `stepper-form` step rather than on its own page.

## Anatomy

1. **Drop area** `.ui-dz__area` – the button to drop files onto or click to choose them
2. **Hint** `.ui-dz__hint` – the accepted types and the size limit
3. **Row** `.ui-dz__row` – one file: type badge, name, size and time left
4. **Progress bar** `.ui-dz__bar` – how far that file's upload has got
5. **Remove** `.ui-dz__icon-btn` – removes the file and cancels its upload; failed uploads also get Retry
6. **Summary** `.ui-dz__foot` – “Uploading 2 of 4 · 1.2 of 8.1 MB”, then what was uploaded, and Clear

## Looks

Standard sets the dashed drop area and the rows in a card on the gray tray, with the summary in the tray below.
Clean is one white card with hairline shadows: a dashed drop area, quieter rows with small file icons, and the
summary as the card's last row, with a shimmer on “Uploading …”. Both fan out the little documents while files are
dragged over, and the card glides to its new height as rows come and go.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the drop area, then to each row's Retry and Remove buttons, then Clear |
| Enter / Space | On the drop area: opens the file chooser. On a button: retries, removes or clears |

When a row is removed, focus moves to the next row's Remove button (or the one before, or the drop area).

## Screen readers

The drop area is a button named by its text – “Drop files here or browse” (“Tap to choose files” on touch
screens) followed by the hint, “PDF, PNG, JPG and more · up to 25 MB each”, which also describes it. The rows sit in a list labelled “Uploads”. Each upload is a progress bar named “report.pdf upload”
with its percentage, a finished file has an “Uploaded” image, and the row buttons are named “Retry report.pdf” and
“Remove report.pdf”. A status region announces each outcome: “report.pdf uploaded”, “report.pdf: upload failed”,
or why a file was refused (“video.mov: .mov files aren't supported”, “scan.pdf: Too large – max 25 MB”). With
`required` and no usable file, the form's message is “Add at least one file”.

## Content

- Leave `hint` unset unless there is more to say – the default lists the accepted types and the limit.
- If you write `hint`, keep it to one line and name the types the way people know them: “PDF or Word, up to 10 MB”.
- In `onUpload`, throw an `Error` whose message says what went wrong in a few words (“Connection lost”) – the row
  shows it and the status region reads it out.

## Do

- Set `accept` and `max-size` so wrong files are refused before they upload, with the reason on the row.
- Pass `onUpload` and stop the upload when its `signal` aborts – that happens when the row is removed.
- Report progress from `onUpload` as it goes, so the bar and the time left are real.

## Don't

- Don't ship without `onUpload`: the uploads are only simulated (set `demo` for previews and galleries).
- Don't use it for a single small file inside a dense form where a drop area takes too much room.
- Don't clear failed rows on your own – people need to see what failed to retry or remove it.

## Example

```html
<form>
  <tc-dropzone id="files" name="files" required></tc-dropzone>
</form>

<script type="module">
  import "trenchcoat/dropzone";
  import "trenchcoat/tokens.css";

  const zone = document.querySelector("#files");
  zone.accept = [".pdf", "image/*"];
  zone.maxSize = 10 * 1024 * 1024;
  zone.onUpload = async (file, onProgress, signal) => {
    const res = await fetch("/upload", { method: "POST", body: file, signal });
    if (!res.ok) throw new Error("Upload failed");
    onProgress(1);
  };
  zone.addEventListener("tc-value-change", (e) => console.log(e.detail.value));
</script>
```

```tsx
import { useState } from "react";
import { Dropzone, type UploadItem } from "trenchcoat/react";
import "trenchcoat/tokens.css";

async function upload(file: File, onProgress: (p: number) => void, signal: AbortSignal) {
  const res = await fetch("/upload", { method: "POST", body: file, signal });
  if (!res.ok) throw new Error("Upload failed");
  onProgress(1);
}

export function Attachments() {
  const [files, setFiles] = useState<UploadItem[]>([]);
  return <Dropzone name="files" accept={[".pdf", "image/*"]} maxSize={10 * 1024 * 1024} onUpload={upload} value={files} onChange={setFiles} />;
}
```
