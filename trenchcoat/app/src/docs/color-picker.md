---
pattern: form
status: new
related: slider-field, segmented-control, number-field, integration-settings
---

## Overview

A colour form control. A square sets saturation and brightness, a slider sets the hue and, with `alpha`, a second
slider sets the opacity. Below them the colour shows as HEX, RGB or CMYK fields – one set at a time, picked with a
segmented control – with Copy beside them. Where the browser has an eyedropper (Chromium), a button picks a colour
from anywhere on screen. A round chip shows the new colour beside the previous one, and pressing the previous half puts
it back. A row of swatches picks a colour from your palette in one press.

The value is a hex string: `#rrggbb`, or `#rrggbbaa` with `alpha`. CMYK is a plain, device-independent conversion from
sRGB – useful for talking about a colour, not a print-profiled (ICC) separation. Send real print work through your
print tool's colour management.

## When to use

- Brand, theme and chart colours in a settings or design-tool page.
- Anywhere people paste colours from other tools in hex, RGB or CMYK and need them in one form.
- Picking a colour from a screenshot or another window with the eyedropper.

## When not to use

- A choice between a few named options that happen to be colours (red / amber / green status) – use
  `segmented-control` or a radio group, with words.
- A single number such as opacity on its own – use `slider-field` or `number-field`.
- Colour management for print – the CMYK here isn't profiled.

## Anatomy

1. **Header** `.tc-head` – the palette icon, the heading and an optional description
2. **Square** `.ui-clp__area` – saturation left to right, brightness bottom to top, with its thumb `.ui-clp__thumb`
3. **Eyedropper** `.ui-clp__eyedropper` – shown only where the browser has one
4. **Preview** `.ui-clp__preview` – the previous colour `.ui-clp__chip--previous` beside the new one `.ui-clp__chip--new`
5. **Hue** `.ui-clp__hue` and **Opacity** `.ui-clp__alpha` – the sliders, in `.ui-clp__tracks`
6. **Format** `.ui-clp__formats` – HEX, RGB or CMYK
7. **Fields** `.ui-clp__fields` – one field per channel `.ui-clp__field`, and Copy `.ui-clp__copy`
8. **Error** `.ui-clp__error` – what's wrong with what was typed
9. **Swatches** `.ui-clp__swatches` – one `.ui-clp__swatch` per colour, the picked one ticked

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. The picker is at most `--tc-clp-max-w` (360 px) wide; below 300 px the square gets shorter and the
fields wrap two to a row. Component tokens: `--tc-clp-area-h` (the square's height), `--tc-clp-thumb`,
`--tc-clp-track-h`, `--tc-clp-chip` and `--tc-clp-check` (the checkerboard behind see-through colours).

## Keyboard

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves between the square, eyedropper, previous colour, hue, opacity, format, fields, Copy and the swatches |
| ← / → on the square | Less or more saturation |
| ↑ / ↓ on the square | More or less brightness; Page Up / Page Down by 10 |
| ← / → or ↑ / ↓ on a slider | Moves the hue by a degree, or the opacity by 1 %; Page Up / Page Down by 10 |
| Shift with an arrow | Steps of 10 |
| Home / End | The start or end of a slider; no or full saturation on the square |
| ↑ / ↓ in a number field | Steps the number by 1 (10 with Shift) and applies it |
| Enter in a field | Applies what's typed |
| Escape in a field | Puts back what the field showed |
| Arrow keys in the swatches | Moves to the next swatch and picks it |

## Screen readers

The picker is a group named by its heading. The square, hue and opacity are sliders: the square says its saturation,
brightness and a colour word (“saturation 60%, brightness 40%, blue”) and is described by its keys; the hue says its
degrees and colour word. Each field is named in full (“Red”, “Cyan”, “Opacity”) though it shows a letter. A field that
can't be read is marked invalid and described by the error, which is also announced. The swatches are a radio group,
each named by its name and hex. The previous half of the chip is a button (“Previous colour #3a6df0, put it back”) and
the new half an image with the colour's hex. Copy announces what it copied.

## Content

- Name swatches for their role – “Primary”, “Accent”, “Danger” – not their hue, so the names survive a rebrand.
- Set `previous` to the saved colour when editing one, so the chip compares against what's live.
- Pick the format your people paste most as the starting `format`.

## Do

- Keep `value` in your form state and save it on submit; preventDefault() on tc-value-change to hold a colour while
  you check it (contrast against a background, say).
- Turn on `alpha` only when the colour may be see-through – it changes the value to eight hex digits.
- Pair the picker with a contrast check when the colour is for text.

## Don't

- Don't use the CMYK fields for print separations – they ignore paper and ink profiles.
- Don't rely on the eyedropper: it's missing in Firefox and Safari, so the fields and swatches must be enough.
- Don't use colour alone to carry meaning in what people pick; give the colour a name or role too.

## Example

```html
<tc-color-picker id="brand" heading="Primary colour" value="#3a6df0" alpha></tc-color-picker>

<script type="module">
  import "trenchcoat/color-picker";
  import "trenchcoat/tokens.css";

  const picker = document.querySelector("#brand");
  picker.swatches = [{ value: "#3a6df0", name: "Primary" }, { value: "#f97316", name: "Accent" }];
  picker.addEventListener("tc-value-change", (e) => console.log(e.detail.value, e.detail.rgb, e.detail.cmyk));
</script>
```

```tsx
import { useState } from "react";
import { ColorPicker } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function BrandColour({ saved }: { saved: string }) {
  const [value, setValue] = useState(saved);
  return (
    <ColorPicker
      title="Primary colour"
      value={value}
      onValueChange={setValue}
      previous={saved}
      swatches={[{ value: "#3a6df0", name: "Primary" }, { value: "#f97316", name: "Accent" }]}
    />
  );
}
```
