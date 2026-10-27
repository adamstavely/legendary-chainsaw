---
pattern: listbox
status: new
related: verification-queue, voice-mode, claim-answer
---

## Overview

A recording – audio or video – with the transcript that follows it. The segment being spoken is highlighted and
kept in view, every segment shows its timestamp and speaker, and segments where speech recognition or translation
was unsure are marked so someone checks them against the recording before relying on them. A machine transcript is
a derivative with its own error rate, not a document; this view keeps the source and the text side by side and
makes the uncertain parts easy to find, search and send to verification.

## When to use

- Reviewing a recorded call, interview, meeting or hearing that was transcribed by speech recognition.
- Machine-translated recordings, where reviewers need the original and the translation together.
- Any workflow where a quote from a recording has to be checked before it's used – "Send to verification" hands the
  segment to your review process.

## When not to use

- A live spoken conversation with the model – use `voice-mode`.
- Checking claims a model made in a written answer – use `claim-answer`, and collect them in `verification-queue`.
- A transcript with no recording to play – use `verification-queue` for the parts to check, or plain text.

## Anatomy

1. **Waveform** `.ui-tsr__wave` – the app's peaks with the playhead; underlines mark low-confidence stretches, ticks mark search matches
2. **Controls** `.ui-tsr__controls` – back, play or pause, forward, the time and the playback speed
3. **Tools** `.ui-tsr__tools` – search, and the switch between the original, the translation or both
4. **Speakers** `.ui-tsr__speakers` – a colour chip per speaker, pressed to show or hide their segments
5. **Segments** `.ui-tsr__list` – the transcript; the segment playing is selected and marked, and a low-confidence one carries an amber flag with its score
6. **Low-confidence count** `.ui-tsr__pill` – how many segments fall below the threshold
7. **Segment actions** `.ui-tsr__foot` – the selected segment's time, speaker and confidence, Copy and Send to verification

## Looks

Standard puts the heading on the gray tray, the player, tools and segments in a white card, and the selected
segment's actions on the tray below; played bars are the accent colour. Clean is one white card divided by
hairlines, with thinner icons and the played bars in ink. Both mark uncertainty the same way: an amber flag with the
score, an amber line under that stretch of the waveform, and a dotted underline under uncertain words.

While the recording plays, the playhead moves every frame. Scrolled off-screen, that frame loop pauses (the host
gets `data-offscreen`); the recording keeps playing and the current segment still follows it, and the playhead
catches up as soon as the component is back in view.

## Keyboard

| Key | What it does |
|---|---|
| Space (waveform) | Plays or pauses |
| K | Plays or pauses |
| J / L | Goes back or forward by `skip` seconds (5 by default) |
| ← / → | Moves to the previous or next segment; in the list, focus moves with it |
| ↑ / ↓ (segments) | Moves to the previous or next segment |
| Home / End (segments) | Moves to the first or last segment |
| Home / End (waveform) | Moves to the start or end of the recording |
| Enter (segments) | Plays from the segment |
| C (segments) | Copies the segment with its timestamp and speaker |
| V (segments) | Sends the segment to verification |
| Enter / Shift+Enter (search) | Moves to the next or previous match |
| Escape (search) | Clears the search |

J, K, L and the arrow keys work anywhere in the component except the search field. Clicking or dragging on the
waveform seeks; clicking a segment plays from it.

## Screen readers

The host is a region named by the heading. The player is a group named "Player": the waveform is a slider named
"Seek" whose value reads as the time, the length and who is speaking ("0:05 of 0:42, Luis Ortega"); the buttons are
"Back 5 seconds", "Play" or "Pause", "Forward 5 seconds" and "Playback speed 1×", with their keys in
`aria-keyshortcuts`. The search field is described by its match count. The view switch and the speaker chips are
toggle buttons (`aria-pressed`) in groups named "Show" and "Speakers"; a chip reads as the name and how many
segments ("Luis Ortega, 4 segments").

The segments are a listbox named "Segments" whose selection follows playback. Each option has `aria-posinset` and
`aria-setsize` (so the count is right while the list is windowed) and reads as the time, the speaker, the text –
each column prefixed with its language when both are shown – and what needs checking (", low confidence 58%,
translation confidence 62%, 3 uncertain words, sent to verification"). A polite status announces the speaker when it changes during playback
("Now speaking: Andrés (supervisor)"), each search step ("Match 1 of 1, 00:33, Luis Ortega"), copies and sends. A
recording that fails to load is announced as an alert with Try again.

## Content

- Give speakers names people recognise (`speakers`) – a role in brackets helps: "Marta (support)". Chips use the
  initials unless you set `short`.
- Name the columns by language with `originalLabel` and `translationLabel`, and say when a translation is machine
  made: "English (machine)".
- Set `threshold` to where your recogniser's scores stop being trustworthy; pass word confidence (`words`) when you
  have it, so reviewers see which words to listen for.
- Write `verifyLabel` as what happens in your process: "Send to verification", "Flag for review".

## Do

- Supply `peaks` computed once on the server – the component never decodes audio.
- Save each send as it happens (`tc-verify`) and pass `sent` back, so the marks survive a reload.
- Keep the recording and the transcript from the same source and version; timestamps must line up.

## Don't

- Don't hide low-confidence segments from the list – mark them and let reviewers decide.
- Don't present a machine translation without the original beside it where the wording matters.
- Don't autoplay; let the person start the recording.

## Example

```html
<tc-transcript-review id="call" heading="Customer call" original-label="Spanish" translation-label="English (machine)"></tc-transcript-review>

<script type="module">
  import "trenchcoat/transcript-review";
  import "trenchcoat/tokens.css";

  const call = document.querySelector("#call");
  call.src = "/recordings/call-4471.mp3";
  call.peaks = await (await fetch("/recordings/call-4471.peaks.json")).json();
  call.speakers = [
    { id: "s1", name: "Marta (support)" },
    { id: "s2", name: "Luis Ortega" },
  ];
  call.segments = [
    { id: "a", start: 0.4, end: 4.2, speaker: "s1", text: "Buenos días, ¿en qué puedo ayudarle?", translation: "Good morning, how can I help?", confidence: 0.96 },
    { id: "b", start: 4.8, end: 9.6, speaker: "s2", text: "Termina en ochenta y dos.", translation: "It ends in eighty-two.", confidence: 0.58 },
  ];
  call.addEventListener("tc-verify", (e) => sendToReview(e.detail.segment));
</script>
```

```tsx
import { useState } from "react";
import { TranscriptReview, type TranscriptSegment } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function CallReview({ src, peaks, segments }: { src: string; peaks: number[]; segments: TranscriptSegment[] }) {
  const [sent, setSent] = useState<string[]>([]);
  return (
    <TranscriptReview
      title="Customer call"
      src={src}
      peaks={peaks}
      segments={segments}
      threshold={0.7}
      sent={sent}
      onSentChange={setSent}
      onVerify={(segment) => console.log("verify", segment.id)}
    />
  );
}
```
