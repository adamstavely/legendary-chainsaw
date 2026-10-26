---
pattern: none
status: new
related: memory-panel, reflection-gate, verification-queue, writing-assistant
---

## Overview

A place for the person's own conclusions, assumptions and things still to verify, written apart from the model's
output and marked as theirs. Each list adds in place; each note edits in place, moves with the keyboard – within its
list or to the list next to it, when an assumption turns into a conclusion – and is removed with Undo. Export hands
your product the notes with their provenance – the session, the author – and a Markdown copy, so the person's
judgement travels with the work instead of being mixed into what the AI said.

## When to use

- Research, review or analysis sessions where the person draws their own conclusions from AI answers.
- Keeping track of what's assumed and what still needs checking before a decision or a hand-off.
- Exporting a record of what a person concluded, separate from the transcript.

## When not to use

- What the assistant remembers about someone across chats – use `memory-panel`.
- Collecting the AI's claims to verify one by one – use `verification-queue`.
- A pause before relying on one answer – use `reflection-gate`.
- Drafting text with the AI – use `writing-assistant`.

## Anatomy

1. **Header** `.ui-syn__bar` – the heading, the “Written by you” tag and Export
2. **List** `.ui-syn__section` – one of the lists, with its heading and count
3. **Note** `.ui-syn__item` – the grip, the text, and Edit and Remove on hover or focus
4. **Grip** `.ui-syn__handle` – moves the note from the keyboard
5. **Add** `.ui-syn__add` – opens a field for a new note in that list
6. **Tray line** `.ui-syn__foot` – the session, the author and the count; Undo after a removal

## Looks

Standard sets the header and the provenance line on a gray tray and the lists on a white card inside it. Clean is one
white card with hairline dividers between the lists and the provenance line in its last row. Both show Edit and
Remove only on hover or focus, and always on touch screens.

## Keyboard

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves through Export, each note's grip, Edit and Remove, and each list's Add button |
| ↑ / ↓ | On a grip, moves the note up or down its list |
| ← / → | On a grip, moves the note to the end of the list before or after |
| Home / End | On a grip, moves the note to the top or bottom of its list |
| Delete / Backspace | On a grip, removes the note (Undo appears on the tray) |
| Alt + ↑ / ↓ | On a note's grip, Edit or Remove, moves the note up or down |
| Enter | In an editor, saves the note, or adds it and keeps the field open for the next |
| Shift+Enter | In an editor, starts a new line |
| Escape | In an editor, cancels the edit or closes the new note's field |

## Screen readers

The notes are a `group` named by the heading. Each list is a `section` named by its heading, which reads with its
count (“Assumptions, 1 note”); the notes are an ordered list. A note's grip is a button named “Move “…”” and
described by how to use it (“Up and down arrows move it in its list, left and right to the list before or after,
Delete removes it”); Edit and Remove are named with the note. A polite `status` region says what happened: “Added to
Assumptions”, “Saved”, “Moved to position 2 of 3”, “Moved to Assumptions, position 2 of 2”, “Removed “…”. Undo is on
the tray.”, “Brought back “…”” and “Exported 5 notes”. Focus stays on a moved note's grip; after a removal it moves
to the next note in the list, the one before, or the list's Add button; Undo returns it to the note.

## Content

- Write list names as plain nouns – “Conclusions”, “Assumptions”, “Still to verify” – and pass your own `sections`
  where your work has other kinds (“Findings”, “Open questions”).
- Give each list an `addLabel` that reads as an action (“Add an assumption”) and an `empty` line that says nothing is
  there yet, without nagging.
- Keep `ownLabel` short and factual: “Written by you”, “Analyst notes”.
- Set `session-id` and `author` – they're what makes the export traceable.

## Do

- Keep the notes visibly apart from the model's answers – beside or under them, never mixed in.
- Store the notes with the session, and send the export's provenance along with the Markdown.
- Let people move an assumption to Conclusions once they've checked it – that's the record of their reasoning.

## Don't

- Don't prefill the lists with the model's own claims – the point is what the person concluded.
- Don't change a note's text on the person's behalf; fix spelling only if they ask.
- Don't hide Export behind a menu when the notes are meant to leave with the work.

## Example

```html
<tc-synthesis-notes id="notes" session-id="2291" author="Maya Chen"></tc-synthesis-notes>

<script type="module">
  import "trenchcoat/synthesis-notes";
  import "trenchcoat/tokens.css";

  const notes = document.querySelector("#notes");
  notes.notes = [{ id: "n1", kind: "verify", text: "Notice period – 30 or 60 days?" }];
  notes.addEventListener("tc-export", (e) => saveNotes(e.detail.sessionId, e.detail.markdown));
</script>
```

```tsx
import { SynthesisNotes, type SynthesisExport, type SynthesisNote } from "trenchcoat/react";
import { useState } from "react";
import "trenchcoat/tokens.css";

export function SessionNotes({ sessionId, onExport }: { sessionId: string; onExport: (d: SynthesisExport) => void }) {
  const [notes, setNotes] = useState<SynthesisNote[]>([]);
  return <SynthesisNotes sessionId={sessionId} author="Maya Chen" notes={notes} onChange={setNotes} onExport={onExport} />;
}
```
