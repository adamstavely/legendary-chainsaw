---
pattern: disclosure
status: new
related: image-grid, pixel-loader, thinking-loader, background-tasks
---

## Overview

One image while it's being made. Queued, the card says the image's place in line; generating, the picture resolves
in a frame that already has the image's shape – an intermediate `preview` from the model, blurred less as the
progress rises, or a soft field in the chart colours whose grain clears – over a bar with the step ("Step 18 of 30"),
the percentage and the time left. When it's done the image cross-fades in. A failed job says why, with Try again; a
cancelled one offers Start again. Under the frame are the prompt (two lines, with Show more for a long one), the model
and the size, and the actions for the state: Cancel while it works; Download, Regenerate and Copy prompt once it's done.

Image Grid shows several finished variations side by side and keeps only a shimmer and a bar on a tile that is still
generating. Image Generation is the single image's own wait: the queue, the steps, the picture taking shape and the
time left. Use it for the one image a person asked for, and Image Grid when they get variations to choose from.

## When to use

- A single generated image – a cover, an illustration, a diagram – that takes seconds or minutes to make.
- When the model reports its progress (steps, a percentage, intermediate previews) and people should see it.
- When people may want to cancel a long job, or try a failed one again.

## When not to use

- Several variations to compare and pick from – use `image-grid`.
- A short wait with nothing to show but that it's working – use `pixel-loader` or `thinking-loader`.
- Many background jobs at once, of any kind – use `background-tasks`.

## Anatomy

1. **Header** `.tc-head` – an image icon, the heading and where the job is: "Queued · 2nd in line", "Generating · Step 18 of 30 · 60%", "Ready"
2. **Frame** `.ui-igen__frame` – the image's shape from the start, set by `aspect-ratio`
3. **Field** `.ui-igen__field` – the `preview` blurred by what's left (`.ui-igen__preview`), or a colour field (`.ui-igen__blobs`), with a grain that clears (`.ui-igen__grain`)
4. **State** `.ui-igen__state` – the phase and percentage in a pill, the step and time left; or why it failed, or that it was cancelled, with Try again or Start again
5. **Bar** `.ui-igen__bar` – the progress along the frame's bottom edge; it sweeps when the progress isn't known
6. **Image** `.ui-igen__img` – the finished image, faded in
7. **Prompt** `.ui-igen__prompt` – the prompt, two lines with `.ui-igen__more` (Show more) when it's long; the model and size as `.ui-igen__chip`
8. **Actions** `.ui-igen__foot` – the time left, Cancel; or Download, Regenerate and Copy prompt

## Looks

Standard puts the header on the gray tray, the frame and the prompt on a white card, and the actions on the tray below
it. Clean is one white card whose first row is the header and whose last row holds the actions, with an accent bar.
Both stop at 440 px wide. A page can set `--tc-image-generation-blur` (how blurred the picture starts, 26 px),
`--tc-image-generation-grain` (how strong the grain starts, 0.42), `--tc-image-generation-cycle` (one drift of the colour
field, 9 s), `--tc-image-generation-bar` and `--tc-image-generation-glyph`.

## Keyboard

| Key | What it does |
|---|---|
| Tab / Shift Tab | Moves between Show more and the buttons for the state |
| Enter / Space | Presses the focused button – Cancel, Try again, Start again, Download, Regenerate, Copy prompt, Show more |

## Screen readers

The card is a `group` named by its heading. While it generates, the bar is a `progressbar` named by the heading and
the phase ("Report cover: Generating"), with its value when the progress is known and a value text with the step and
time left ("Step 18 of 30, 60%, about 3 s left"). A status region says each change of state once – "Queued · 2nd in
line", "Generating", "Ready: Teal cover with ledger bars under a magnifying glass" (the finished image's alt text, said
once), "Couldn't generate the image: The model timed out", "Cancelled" – and the progress every quarter (25%, 50%,
75%), never every tick. The frame's field and grain are hidden from screen readers; the finished image has its `alt`.
Show more is a disclosure button (`aria-expanded`, `aria-controls` the prompt).

## Content

- Name the card for what the image is for: "Report cover", "Slide 4 illustration" – not "Image generation".
- Give `alt` before the image is done, describing what it will show once you know it; it's what people hear when it
  arrives.
- Keep `phase` to one word – "Generating", "Refining", "Upscaling".
- Keep `error` short and specific: "The model timed out", "The prompt was declined" – not a stack trace.
- Show `model` and `size` when people choose them, so they can tell two jobs apart.

## Do

- Set `aspect-ratio` to the image's real shape, so nothing moves when it arrives.
- Pass `step` and `steps`, or `progress`, as the model reports them; pass `eta` only when it's an estimate you trust.
- Pass the model's intermediate `preview` when it sends one – the picture taking shape is the reason to use this card.
- Answer `tc-cancel`, `tc-retry` and `tc-regenerate` by stopping or starting the job, and update `status` as it moves.

## Don't

- Don't fake a progress you don't have – leave `progress` out and the bar sweeps.
- Don't announce every step yourself; the card already says each quarter.
- Don't use it for the whole set of variations – the grid compares them; this card waits for one.

## Example

```html
<tc-image-generation
  id="cover"
  heading="Report cover"
  aspect-ratio="2:3"
  model="Studio model"
  size="1024 × 1536"
  prompt="A calm, editorial cover for an annual audit report: ledger bars under a magnifying glass, teal and amber"
  status="generating"
  steps="30"
></tc-image-generation>

<script type="module">
  import "@adamstavely/trenchcoat/image-generation";
  import "@adamstavely/trenchcoat/tokens.css";

  const card = document.querySelector("#cover");
  job.on("step", ({ step, preview }) => Object.assign(card, { step, preview }));
  job.on("done", ({ url }) => Object.assign(card, { status: "done", src: url, alt: "Teal cover with ledger bars under a magnifying glass" }));
  card.addEventListener("tc-cancel", () => job.cancel());
  card.addEventListener("tc-retry", () => job.start());
</script>
```

```tsx
import { useState } from "react";
import { ImageGeneration, type ImageGenerationStatus } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Cover({ prompt, start, stop }: { prompt: string; start: () => void; stop: () => void }) {
  const [status, setStatus] = useState<ImageGenerationStatus>("queued");
  const [step, setStep] = useState(0);
  return (
    <ImageGeneration
      title="Report cover"
      prompt={prompt}
      aspectRatio="2:3"
      status={status}
      step={step}
      steps={30}
      onCancel={() => {
        stop();
        setStatus("cancelled");
      }}
      onRetry={() => {
        setStep(0);
        setStatus("queued");
        start();
      }}
      onRegenerate={start}
    />
  );
}
```
