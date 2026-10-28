---
pattern: toolbar
status: new
related: speed-reader, voice-mode, message-actions, selection-translate
---

## Overview

Reads a passage aloud with the browser's own voices, while the text stays on screen. The sentence being read is
shaded and the word being spoken is marked, so a reader can follow along, look away and find their place again, or
listen without reading. Play, Pause and Resume, Stop, and previous and next sentence sit in a toolbar; under it are the
voice, the speed (0.5–2×) and the pitch. Click any sentence to read from there. A line under the passage says where it
is ("Sentence 3 of 12") and roughly how long is left.

It uses the Web Speech API and speaks one sentence at a time, so skipping and a new speed or voice take effect at
once. Where the browser has no speech synthesis, the passage stays readable and a line says read aloud isn't
available.

## When to use

- Articles, guides, instructions and summaries people may want to listen to – an accessibility aid and a convenience.
- Proofreading by ear: hearing a draft read back with the words marked.
- Language practice, where following the marked word matters.

## When not to use

- A spoken conversation with the model – use `voice-mode`.
- A Read aloud button on a chat message – `message-actions` has one.
- Reading fast with the eyes rather than the ears – use `speed-reader`.

## Anatomy

1. **Header** `.tc-head` – the icon, the heading, the description and a Reading / Paused pill while it's going
2. **Passage** `.ui-tts__passage` – the text, in paragraphs; it scrolls inside its own height and follows the reading
3. **Sentence** `.ui-tts__sentence` – shaded while it's read; click it to read from there
4. **Word** `.ui-tts__word` – marked while it's spoken, when the voice reports words
5. **Progress** `.ui-tts__progress` – the sentence number and the time left
6. **Controls** `.ui-tts__bar` – previous sentence, Play / Pause / Resume `.ui-tts__play`, next sentence and Stop
7. **Settings** `.ui-tts__settings` – the voice, the speed and the pitch
8. **Unsupported** `.ui-tts__unsupported` – shown instead of reading where the browser can't speak

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. Below about 480 px the voice takes its own row above the speed and pitch; below about 320 px each
setting gets its own row. The passage's height is `--tc-tts-passage-h` (260 px by default).

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the passage (one stop), the controls (one stop), then the voice, speed and pitch |
| ← → ↑ ↓ in the passage | Move between sentences |
| Home / End in the passage | Go to the first or last sentence |
| Enter on a sentence | Reads from that sentence |
| Space on a sentence | Reads from it – or pauses and resumes when it's the one being read |
| ← → in the controls | Move between the buttons |
| Enter / Space on a button | Presses it |

## Screen readers

The passage is a group named "Passage"; each sentence is a button whose name is its text, with `aria-current` on the
one being read and a description of Enter and Space. The controls are a toolbar named "Reading controls"; the icon
buttons are named "Previous sentence", "Next sentence" and "Stop". A polite status says "Reading", "Paused",
"Stopped" or "Finished reading" – never each sentence, which the speech already says. The speed has a value text such
as "1.5 times".

## Content

- Pass plain text; a blank line starts a new paragraph. Strip markup, footnote markers and URLs first – they're read
  out literally.
- Set `lang` to the text's language, so a matching voice is picked and sentences are split the right way.
- Spell out what a voice would stumble on: "AD 1871" reads better than "1871 C.E." in most voices.

## Do

- Keep the speed and voice in your store with tc-rate-change and tc-voice-change, so they follow the person around.
- Put it next to the text it reads, or use it as the text – not as a separate player for something hidden.

## Don't

- Don't start reading on load – sound should start when someone asks for it.
- Don't hide the text: listeners often want to glance back.

## Example

```html
<tc-text-to-speech id="guide" heading="Harrow Point light" lang="en"></tc-text-to-speech>

<script type="module">
  import "trenchcoat/text-to-speech";
  import "trenchcoat/tokens.css";

  const guide = document.querySelector("#guide");
  guide.text = "The Harrow Point light was first lit in 1871. Today it still flashes twice every fifteen seconds.";
  guide.addEventListener("tc-rate-change", (e) => localStorage.setItem("tts-rate", String(e.detail.rate)));
  guide.addEventListener("tc-end", (e) => console.log(e.detail.completed ? "finished" : "stopped"));
</script>
```

```tsx
import { useState } from "react";
import { TextToSpeech } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function AudioGuide({ text }: { text: string }) {
  const [rate, setRate] = useState(1);
  return <TextToSpeech title="Audio guide" text={text} lang="en" rate={rate} onRateChange={setRate} onReadEnd={(done) => console.log(done)} />;
}
```
