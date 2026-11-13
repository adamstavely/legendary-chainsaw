---
pattern: form
status: new
related: point-and-ask, image-generation, image-grid, signature-pad
---

## Overview

Mark the part of an image that should change, then say how. A brush paints a tinted mask over the image, an eraser
takes paint away, and a box tool selects a rectangle – the way to mark without a pointer, since the box moves and
resizes from the keyboard. Undo and Redo step through the mask's history and Clear empties it. A line under the image
says how much is selected. Then an instruction – “Replace the chart with a table” – and Generate, which hands the page
the instruction, the mask as a black-and-white PNG at the image's own size, the mask's bounds and how much it covers.
The page sends that to its image model and sets `busy` while it works.

## When to use

- Inpainting: changing one part of a generated or uploaded image and keeping the rest.
- Fixing a detail in a picture an agent made – a wrong label, a stray object, a chart to redraw.
- Anywhere people need to say “here” about part of an image, and the answer is an edited image.

## When not to use

- Asking a question about part of an image, not changing it – use `point-and-ask`.
- Choosing between whole generated images – use `image-grid`.
- Showing an image while it's generated – use `image-generation`.

## Anatomy

1. **Tools** `.ui-edr__toolset` – Brush, Erase and Box, as one radio group; `.ui-edr__tool` is one tool
2. **Brush size** `.ui-edr__size` – a slider in px, hidden for the box tool
3. **History** `.ui-edr__history` – Undo, Redo and Clear
4. **Image** `.ui-edr__stage` – the image at its own shape, with the mask over it (`.ui-edr__mask`)
5. **Box** `.ui-edr__draft` – the box tool's selection, moved and resized from the keyboard
6. **Status** `.ui-edr__status` – how much of the image is selected
7. **Instruction** `.ui-edr__field` – what should change
8. **Generate** `.ui-edr__generate` – sends the edit; `.ui-edr__hint` says what's missing first

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row. In both the mask is the accent colour at a tint, so the picture stays readable under it, and the box tool's
selection is a dashed accent outline. `--tc-edr-tint-opacity` (0.45) sets how strong the tint is.

## Keyboard

| Key | What it does |
|---|---|
| Arrow keys (tools) | Move between Brush, Erase and Box |
| Arrow keys (box) | Move the box |
| Shift + arrow keys (box) | Resize the box |
| Enter (box) | Add the box to the mask |
| Shift + Enter (box) | Take the box away from the mask |
| Ctrl / ⌘ + Z | Undo |
| Shift + Ctrl / ⌘ + Z, Ctrl / ⌘ + Y | Redo |
| Ctrl / ⌘ + Enter (instruction) | Generate |

Brushing needs a pointer – mouse, pen or touch. The box tool does the same job from the keyboard.

## Screen readers

The tools are a radio group named “Tool”. The slider is named “Brush size” and reads its value in px. The box is
announced as “Selection box” with where it sits and how big it is (“30% from the left, 20% from the top, 40% wide, 30%
tall”), and describes its keys. The status line – “About 18% of the image selected” – describes Generate. A polite live
region says “Box added to the mask”, “Undone”, “Mask cleared”, and what's missing when Generate can't run yet. While
`busy` the card is `aria-busy` and Generate reads “Generating…”.

## Content

- Write the image's `alt` as what it shows; it's what screen-reader users mark against.
- Keep the placeholder an example of a good instruction: one change, said plainly.
- Name the heading after the image – “Edit page 4” – not the tool.

## Do

- Send the mask at the image's own size (`tc-edit` does) so the model's edit lines up.
- Set `busy` while the model works and clear it when the new image arrives.
- Keep the mask after an edit so people can adjust it and try again.

## Don't

- Don't make brushing the only way to mark – keep the box tool.
- Don't clear the instruction on Generate; people often tweak and resend it.
- Don't run the edit on every stroke – wait for Generate.

## Example

```html
<tc-edit-region
  heading="Edit page 4"
  src="/images/report-page-4.png"
  alt="Annual report page 4: a bar chart of audits by quarter beside a table of findings"
></tc-edit-region>

<script type="module">
  import "@adamstavely/trenchcoat/edit-region";
  import "@adamstavely/trenchcoat/tokens.css";

  const editor = document.querySelector("tc-edit-region");
  editor.addEventListener("tc-edit", async (e) => {
    const { instruction, mask, bounds } = e.detail;
    // The element is busy until the page clears it
    const res = await fetch("/api/images/page-4/edit", { method: "POST", body: JSON.stringify({ instruction, mask, bounds }) });
    if (res.ok) editor.src = (await res.json()).src;
    editor.busy = false;
  });
</script>
```

```tsx
import { useState } from "react";
import { EditRegion, type EditRegionEdit } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function EditPage({ src, onEdited }: { src: string; onEdited: (edit: EditRegionEdit) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  return (
    <EditRegion
      title="Edit page 4"
      src={src}
      alt="Annual report page 4: a bar chart of audits by quarter beside a table of findings"
      busy={busy}
      onEdit={(edit) => {
        setBusy(true);
        void onEdited(edit).finally(() => setBusy(false));
      }}
    />
  );
}
```
