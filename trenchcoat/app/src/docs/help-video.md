---
pattern: dialog
status: new
related: tooltip, tips-panel, setup-guide, dialog
---

## Overview

Point-in-time help: a small film-frame icon that sits beside a heading, a field label or a toolbar, and opens one short tutorial in a modal player. Sprinkle one wherever a feature is easier to show than to explain. Each carries its own video.

The icon is a single film cell with sprocket holes along its top and bottom and a play mark cut through it, drawn in the text colour and sized to the text around it. Pointing at it shows a tooltip with the video's title and length. Once the video has been watched, a small check sits on the icon's bottom corner. When the video changes, set `updated-on` to the date: a small dot sits on the icon's top-right corner for `new-days` days (14 by default), the tooltip and name say Updated, and the player's header says when. Opening the video clears the dot for that person (`tc-update-seen-change`); pass `update-seen` back to keep it cleared. The player has the title, the video with its captions, Transcript and Download transcript, a short description, chapters to jump to and, at the end, Watch again and Done. Transcript opens the words beside the video as timed lines: the line being said is marked as it plays, and a line jumps the video to it. They're read from the captions file unless the page passes its own `transcript`; Download saves them as a text file, or links `transcript-file` when the page has one, such as a PDF. Escape, Close or a click outside shuts it, and focus goes back to the icon.

## When to use

- A feature, field or screen that's quicker to show than to explain: a workflow, a gesture, a setting with consequences.
- Help that belongs where the question comes up, not on a separate help page.
- Short videos – a minute or two each. One icon, one video.

## When not to use

- A sentence or two of explanation – use `tooltip`.
- A list of tips or a getting-started checklist – use `tips-panel` or `setup-guide`.
- A modal that isn't a video – use `dialog`.

## Anatomy

1. **Trigger** `.ui-hvd__trigger` – the button, holding `.ui-hvd__mark` with the film cell `.ui-hvd__icon`, `.ui-hvd__seen` once watched, and `.ui-hvd__new` – the Updated dot – after a recent update
2. **Label** `.ui-hvd__label` – words beside the icon, when `label` is set
3. **Tooltip** `.ui-hvd__tip` – the title and length, on hover and keyboard focus, when there's no label
4. **Player** `.ui-hvd__dialog` – `.ui-hvd__bar` with `.ui-hvd__kicker`, the title and `.ui-hvd__close`; `.ui-hvd__screen` with the video; `.ui-hvd__tools` with `.ui-hvd__show` (Transcript) and `.ui-hvd__download`, and `.ui-hvd__reader` with the `.ui-hvd__cue` lines when shown; `.ui-hvd__info` with the description and `.ui-hvd__chapter` buttons; `.ui-hvd__end` with Watch again and Done once it has played through

## Looks

The icon is the same in Standard and Clean: the text colour, a shade quieter (`--tc-hvd-ink`), turning to the full text colour on hover (`--tc-hvd-ink-hover`). With `label` it becomes a small pill. `size` sets it against the text around it – `sm` 1em for labels and toolbars, `md` 1.25em for section headings, `lg` 1.5em for page titles – and `--tc-hvd-size` takes any length. `--tc-hvd-player` sets the player's widest, and `--tc-hvd-dot` the Updated dot's colour (the accent by default).

## Keyboard

| Key | What it does |
|---|---|
| Tab | Move to the icon; its tooltip shows |
| Enter / Space | Open the player; the video takes focus and starts |
| Tab in the player | Move through the video's controls, Transcript, Download, the transcript's lines, the chapters, Watch again, Done and Close – focus stays in the player |
| Enter on a transcript line | Jump the video to that line |
| Escape | Close the player; focus goes back to the icon |

## Screen readers

The icon is a button named "Watch video:" with the title, its length and whether it was watched, and it says it opens a dialog. With a `label`, the name starts with the label's words. While the Updated dot shows, the name ends with "Updated"; the dot itself is hidden from assistive technology. The player is a modal dialog named after the video and described by its description; the rest of the page is inert while it's open. The current chapter is marked with `aria-current`. Transcript says whether it's expanded and which region it controls; the transcript is a region named Transcript, each line a button with its time and words, and the line being said is marked with `aria-current`. If the captions file can't be read, a status line says so. When the video plays to its end, a polite status line says it was watched. The drawing and the tooltip are hidden from assistive technology, because the button's name already says what they show.

## Content

- Title the video by the task it teaches: "Set a risk threshold", not "Help" or "Video".
- Keep descriptions to a sentence; they show under the player.
- Give `duration` in seconds, and chapters as `{ time, title }` with `time` in seconds.
- Always pass captions (`captions`, a WebVTT file) for a file you host – they're the transcript too. Embeds from a video host bring their own captions; pass `transcript` lines (or a `transcript-file`) so the transcript is there as well.
- Use `label` sparingly – "Watch how" beside a button that people hesitate over.

## Do

- Put the icon right after the words it explains, on the same line.
- Store `watched` per person and pass it back, so the checks survive a reload.
- Set `updated-on` only for a change worth re-watching – a new step, a moved button – and store `update-seen` per person and per update, so the dot comes back for the next one.
- Set `watched` yourself for an embed – the element can't see when an iframe's video ends.
- Mark speakers in the captions with `<v Name>` if you like – the transcript drops the tags and keeps the words.

## Don't

- Don't put one beside every heading – save them for the places people actually get stuck.
- Don't put it inside a `<label>`: its words would become part of the field's name. Put it beside the label instead.

## Example

```html
<h2>
  Alert queue
  <tc-help-video
    id="queue-help"
    heading="Triage the alert queue"
    duration="125"
    src="/help/queue.mp4"
    captions="/help/queue.vtt"
    poster="/help/queue.jpg"
    updated-on="2026-11-17"
  ></tc-help-video>
</h2>

<script type="module">
  import "@adamstavely/trenchcoat/help-video";
  import "@adamstavely/trenchcoat/tokens.css";

  const help = document.querySelector("#queue-help");
  help.description = "Sort new alerts by risk and take the ones that are yours.";
  help.chapters = [
    { time: 0, title: "Sort by risk" },
    { time: 48, title: "Take an alert" },
  ];
  help.watched = localStorage.getItem("help:queue") === "watched";
  help.addEventListener("tc-watched-change", () => localStorage.setItem("help:queue", "watched"));
  // The dot clears once this person opens the update; key it by the date so the next update shows again
  help.updateSeen = localStorage.getItem("help:queue:update") === help.updatedOn;
  help.addEventListener("tc-update-seen-change", () => localStorage.setItem("help:queue:update", help.updatedOn));
</script>
```

```tsx
import { useState } from "react";
import { HelpVideo } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function QueueHeading({ seen, onSeen }: { seen: boolean; onSeen: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <h2>
      Alert queue{" "}
      <HelpVideo
        title="Triage the alert queue"
        duration={125}
        src="/help/queue.mp4"
        captions="/help/queue.vtt"
        open={open}
        onOpenChange={setOpen}
        watched={seen}
        onWatchedChange={onSeen}
      />
    </h2>
  );
}
```
