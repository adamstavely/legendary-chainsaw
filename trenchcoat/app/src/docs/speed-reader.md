---
pattern: toolbar
status: new
related: text-to-speech, file-summary, digest, selection-translate
---

## Overview

Speed reading by showing a passage one word at a time in the same place (rapid serial visual presentation), so the eye
never has to move along a line. Each word's optimal recognition point – the letter just left of its middle, where the
eye takes a word in fastest – is drawn in the accent colour and in bold, and always sits on the guide marks at the
centre of the frame. Sentence ends, commas and long words stay up a little longer, so the rhythm follows the text.

Pause, and the sentence around the word appears under the frame with the word marked, to recover context. A scrubber
shows and sets the place ("Word 120 of 840") with the time left beside it. The speed runs from 100 to 1000 words a
minute, and it can show one, two or three words at a time.

## When to use

- Reading a short to medium passage quickly: a briefing, an abstract, an email, a summary.
- Reading on a small screen, where the frame needs less room than a column of text.
- Practice tools that train reading speed.

## When not to use

- Text people need to study, compare or skim back and forth in – show it as text.
- Listening rather than reading – use `text-to-speech`.
- Condensing a long document – use `file-summary` or `digest` first, then read the summary.

## Anatomy

1. **Header** `.tc-head` – the icon, the heading, the description and the speed `.ui-spr__pill`
2. **Frame** `.ui-spr__frame` – where the words appear; focus it to use the keys
3. **Guide** `.ui-spr__guide` – two hairlines with a tick at the centre
4. **Word** `.ui-spr__word` – the word or chunk, split around the recognition point `.ui-spr__pivot`
5. **Context** `.ui-spr__context` – while paused, the sentence around the word with it marked `.ui-spr__mark`
6. **Controls** `.ui-spr__bar` – start over, previous sentence and word, Play / Pause `.ui-spr__play`, next word and sentence
7. **Scrubber** `.ui-spr__scrub` – the place in the text and the time left
8. **Settings** `.ui-spr__settings` – the speed and the words at a time

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. Below about 480 px the frame and the words get a little smaller and the settings stack. Component
tokens: `--tc-spr-frame-h` for the frame's height and `--tc-spr-guide` for the tick colour.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the frame, the controls (one stop), the scrubber, the speed and the words at a time |
| Space in the frame | Plays or pauses |
| ← / → in the frame | Steps back or forward a word (or a chunk) |
| Shift+← / Shift+→ in the frame | Steps back or forward a sentence |
| Home / End in the frame | Goes to the first or last word |
| ← → in the controls | Move between the buttons |
| ← → on the scrubber or speed | Change it |

## Screen readers

The frame is a group named "Reader" with its keys in `aria-keyshortcuts` and described in words. The word in it is
read whole – the split around the recognition point is hidden. Nothing is announced per word; a polite status says
"Reading at 350 words a minute", "Paused at word 120 of 840" and "Finished". The scrubber is a slider named "Place in
the text" with a value text such as "Word 120 of 840"; the speed's value text is "350 words a minute". The icon
buttons are named "Start over", "Previous sentence", "Previous word", "Next word" and "Next sentence".

## Content

- Pass plain text; a blank line starts a new paragraph and ends a sentence. Strip markup and footnote markers first.
- Keep passages short – a few hundred words. Comprehension drops on long texts read this way.
- Start new readers around 250–300 words a minute.

## Do

- Keep `position` in your store to let people leave and come back to the same word.
- Offer the plain text alongside, for anyone who would rather read normally.

## Don't

- Don't start playing on load – let the reader press Play when they're ready.
- Don't use it for text with tables, code or lists – they don't survive being read a word at a time.

## Example

```html
<tc-speed-reader id="reader" heading="A short history of lighthouses" wpm="350"></tc-speed-reader>

<script type="module">
  import "trenchcoat/speed-reader";
  import "trenchcoat/tokens.css";

  const reader = document.querySelector("#reader");
  reader.text = "For most of history, sailors found their way home by fires lit on headlands. Early towers burned wood.";
  reader.addEventListener("tc-position-change", (e) => localStorage.setItem("reader-at", String(e.detail.position)));
  reader.addEventListener("tc-finish", (e) => console.log(`read ${e.detail.words} words`));
</script>
```

```tsx
import { useState } from "react";
import { SpeedReader } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Briefing({ text }: { text: string }) {
  const [position, setPosition] = useState(0);
  const [wpm, setWpm] = useState(300);
  return <SpeedReader title="Briefing" text={text} wpm={wpm} onWpmChange={setWpm} position={position} onPositionChange={setPosition} />;
}
```
