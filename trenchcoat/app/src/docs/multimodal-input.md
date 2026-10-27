---
pattern: toolbar
status: new
related: chat-composer, dropzone, context-tray, voice-mode
---

## Overview

A message box that takes images, recordings, videos and documents along with the text. Files come in through the clip
button, by dropping them anywhere on the box, or by pasting them into the message. Each becomes a tile with a preview –
an image's thumbnail, a recording's or a video's length, a document's page count – its upload progress, and the token
estimate the app supplies; the box adds the estimates up against a budget. Files of a format it doesn't take, or over
the size for their kind, are turned away with the reason. The element uploads nothing: it hands the app the files and
shows what the app reports back.

## When to use

- A chat or prompt box where people attach mixed media for the model to read.
- Anywhere the model's context is limited and people should see what their attachments cost before sending.
- Forms that send a question with evidence – a photo, a recording, an invoice – to an assistant.

## When not to use

- A plain text chat box with a model picker and voice input – use `chat-composer`.
- Uploading files to keep, with no message – use `dropzone`.
- Showing what's already in the model's context – use `context-tray`.

## Anatomy

1. **Box** `.ui-mmi__box` – the drop target holding the tiles, the message and the tools
2. **Tile** `.ui-mmi__tile` – one attachment: preview, name, state or estimate, Retry and Remove
3. **Turned away** `.ui-mmi__rejected` – the files that weren't attached, and why
4. **Message** `.ui-mmi__message` – the text, growing with what's written
5. **Totals** `.ui-mmi__totals` – the count, the token estimate against the budget, and why Send waits

## Looks

Standard is a white box on a gray tray, with the totals on the tray below it, gray tiles and an ink Send button.
Clean is one white box with hairline-outlined tiles, thinner icons, the totals between the clip and Send, and a smaller
Send. Kind tiles are tinted per kind in both; a failed tile turns red. In a narrow container the tiles stack one per row.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the attachments (one stop), the message, Attach files and Send |
| ← / → | In the attachments: moves between the tiles' buttons, wrapping |
| Home / End | In the attachments: the first or last button |
| Delete / Backspace | In the attachments: removes the tile in focus |
| Enter | In the message: sends |
| Shift + Enter | In the message: starts a new line |

Removing a tile moves focus to the next tile's Remove, else the one before, else the message. Dismissing the turned-away
list returns focus to the message. Pasting files into the message attaches them.

## Screen readers

The tiles are a `toolbar` named “Attachments: 5”; each tile is a group named by the file. Remove and Retry are named
“Remove invoice.pdf” and “Retry contract-scan.pdf” and described by the tile's line – “Document, 6 pages. 220 KB · ≈ 3.4k
tokens” or “Document. Didn't upload – the connection dropped”. The message is named by `label` and, while files are
turned away, described by the list of reasons. A status region says what happened: “Attached 3 files”, “IMG_4471.heic
wasn't attached: HEIC files aren't supported – use PNG, JPEG or WEBP”, “Removed note.m4a”, “Sent”. When Send waits, its
tooltip and the totals say why: “Waiting for 2 uploads”, “Retry or remove the file that didn't upload”, “2.1k tokens over
the budget”.

## Content

- Pass `accept` as the formats your model really reads; the reasons and the hint are built from it.
- Set `limits` per kind when they differ (videos are larger), or one `maxSize`.
- Write an upload `error` as a short cause – “the connection dropped” – it follows “Didn't upload –”.
- Report `tokens` once you have an estimate; until then the tile says “Estimating tokens”.

## Do

- Upload from the `add` change: `change.files` holds each new attachment with its File.
- Report progress, failures, `duration`, `pages`, `preview` and `tokens` back through `value`.
- Set `budget` to what the model can take, so people see the cost before Send is blocked.

## Don't

- Don't show a token count you didn't estimate – leave `tokens` unset.
- Don't drop a failed upload silently; keep the tile so Retry is there.
- Don't use it for long transcripts or large datasets – they belong in a source, not a message.

## Example

```html
<tc-multimodal-input id="ask" budget="64000"></tc-multimodal-input>

<script type="module">
  import "trenchcoat/multimodal-input";
  import "trenchcoat/tokens.css";

  const ask = document.querySelector("#ask");
  ask.accept = ["image/png", "image/jpeg", "audio/*", ".pdf"];
  ask.addEventListener("tc-value-change", (e) => {
    if (e.detail.change.type === "add") for (const { attachment, file } of e.detail.change.files) console.log("upload", attachment.id, file);
  });
  ask.addEventListener("tc-send", (e) => console.log(e.detail.text, e.detail.attachments));
</script>
```

```tsx
import { useState } from "react";
import { MultimodalInput, type MultimodalAttachment } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Ask() {
  const [attachments, setAttachments] = useState<MultimodalAttachment[]>([]);
  return (
    <MultimodalInput
      value={attachments}
      onChange={(next, change) => {
        setAttachments(next);
        if (change.type === "add") change.files.forEach(({ attachment }) => console.log("upload", attachment.name));
      }}
      accept={["image/*", "audio/*", ".pdf"]}
      budget={64000}
      onSend={(text, files) => console.log(text, files.length)}
    />
  );
}
```
