---
pattern: none
status: new
related: region-overlay, image-grid, image-generation, inline-diff
---

## Overview

An original and its edit in one frame, with a divider to drag between them: the original on one side of the line,
the edit on the other. It's for checking what an AI edit changed – a retouched photo, a cleaned-up chart, an upscale,
a removed background. Drag the divider, or press anywhere in the frame and drag; focus it and the arrow keys move it.
Each side is labelled where there's room. Side by side puts the two in labelled columns instead, and
`orientation="vertical"` stacks them – the original above, the edit below.

## When to use

- Reviewing an image edit before accepting it, where the difference is in the detail.
- Showing the effect of a filter, a cleanup or an upscale on the same image.
- Comparing two renders of the same layout.

## When not to use

- Picking one of several generated images – use `image-grid`.
- Showing an image while it's being generated – use `image-generation`.
- Showing what a vision model read on an image – use `region-overlay`.
- Comparing two versions of text – use `inline-diff`.

## Anatomy

1. **Frame** `.ui-bfa__frame` – the original, with the edit on top of it clipped to its side of the divider
2. **Divider** `.ui-bfa__line` – the line between the two
3. **Handle** `.ui-bfa__handle` – the round grip on the line; the slider people focus
4. **Labels** `.ui-bfa__label` – “Before” and “After” (or the images' own labels) in the corners, hidden when there's no room
5. **Side by side** `.ui-bfa__mode` – the header's switch to two columns
6. **Columns** `.ui-bfa__pair` – the two images side by side, each with its caption

## Looks

Standard puts the header on the gray tray above a white card holding the frame. Clean is one white card with the
header as its first row. `--tc-before-after-handle` sets the handle's size; it grows on touch screens.

## Keyboard

| Key | What it does |
|---|---|
| ← / → | Moves the divider 1% left or right |
| ↑ / ↓ | Moves the divider 1% – up or down when vertical; when horizontal, ↑ shows more of the original and ↓ less |
| Shift + an arrow | Moves it 10% |
| Page Up / Page Down | Moves it 10% |
| Home / End | All the edit, or all the original |
| Enter or Space on Side by side | Switches between the divider and two columns |

## Screen readers

The handle is a `slider` named “Divider between before and after” (from the images' labels), with its orientation,
its value from 0 to 100 and a value text that says both sides – “42% before, 58% after”. It's described by how the
keys move it. Each image has its own alt text; the corner labels are hidden from assistive technology because the
slider says them. Side by side is a toggle button with `aria-pressed`, and in that mode each image is a `figure` with
its label as the caption.

## Content

- Write each image's `alt` as what it shows, so the difference can be understood without seeing it.
- Use labels that say what each side is – “Original” and “AI edit”, “Low light” and “Enhanced” – when Before and After
  aren't clear enough.
- Give both images the same size and framing; the frame takes its size from the original.
- Pass the images as `beforeImage` and `afterImage` – `before` and `after` are DOM methods every element already has.

## Do

- Start the divider where the change is easiest to see.
- Say what was asked for in the description, so people judge the edit against it.
- Offer Side by side when the change is in colour or layout rather than detail.

## Don't

- Don't compare images of different sizes or crops – the divider lines them up by position, not content.
- Don't use it for more than two images.
- Don't animate the divider on its own; let people move it.

## Example

```html
<tc-before-after id="cleanup" heading="Chart cleanup" position="40"></tc-before-after>

<script type="module">
  import "@adamstavely/trenchcoat/before-after";
  import "@adamstavely/trenchcoat/tokens.css";

  const image = (fill) =>
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><rect width="320" height="180" fill="${fill}"/></svg>`);
  const compare = document.querySelector("#cleanup");
  compare.beforeImage = { src: image("#e9e4d8"), alt: "The original chart", label: "Original" };
  compare.afterImage = { src: image("#dfe7f3"), alt: "The cleaned-up chart", label: "AI edit" };
  compare.addEventListener("tc-position-change", (e) => console.log(e.detail.position));
</script>
```

```tsx
import { useState } from "react";
import { BeforeAfter, type BeforeAfterImage } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function EditReview({ before, after }: { before: BeforeAfterImage; after: BeforeAfterImage }) {
  const [position, setPosition] = useState(50);
  return <BeforeAfter title="Photo retouch" description="Asked: “Remove the glare”" beforeImage={before} afterImage={after} position={position} onPositionChange={setPosition} />;
}
```
