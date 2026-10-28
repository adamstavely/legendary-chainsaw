---
pattern: list
status: new
related: publication-impact, breakdown-chart, usage-meter
---

## Overview

Who is reading, in three short groups. The sector mix shows each kind of reader – academic, industry, government,
nonprofit – as a bar with its share. The split shows readers inside and outside the organisation as one bar in two
parts, with both shares in words beneath. The places show the top countries or regions, with "Other" for the rest.
Each group is optional and shows only when it has data. Values are counts or shares in any unit: each group's
percentages come from its own total. A readout under the groups names the row under the pointer or focus in full.

## When to use

- The audience of a paper, a report, a dataset or a page – who reads it and where they are.
- A side panel next to reach figures, or inside `publication-impact` (it embeds this one).
- Any short mix of a few categories where the share matters more than the exact count.

## When not to use

- A share of a whole that people slice and filter – use `breakdown-chart`.
- Use against a limit – use `usage-meter`.
- One paper's whole impact – use `publication-impact`, which includes this.

## Anatomy

1. **Group** `.ui-audm__group` – a heading and its rows: Sector, Internal vs external, Where
2. **Row** `.ui-audm__row` – a name, a bar and the share
3. **Split** `.ui-audm__split` – one bar in two parts, internal and external
4. **Split key** `.ui-audm__split-key` – both shares in words under the split
5. **Readout** `.ui-audm__readout` – the row under the pointer or focus, named in full

## Looks

Standard is a white card on a gray tray, with the header on the tray. Clean is one white card with the header as its
first row. The bars use `--tc-audm-ink` (by default `--tc-chart-1`); set it on the element to change them. With
`embedded` there is no card or header, for use inside another component.

## Keyboard

The rows are one tab stop.

| Key | What it does |
|---|---|
| ↑ / ↓ (or ← / →) | Moves to the previous or next row, across groups |
| Home / End | Moves to the first or last row |
| Tab | Leaves the groups |

## Screen readers

Each group is a section named by its heading, holding a list. Each row reads its name and share, “Industry, 23%”;
the two parts of the split read the same way, “Internal, 6%”. The bars, the split key and the readout repeat what
the rows say, so they're hidden from screen readers.

## Content

- Name sectors and places as readers would: “Government”, “United Kingdom”, not codes.
- Put "Other" last in `places` yourself, with what's left over.
- Set `unit` to who the shares are of – “readers”, “downloads” – for the readout.

## Do

- Keep each group to about six rows; fold the rest into "Other".
- Use the same order for sectors everywhere they appear, so they compare at a glance.

## Don't

- Don't mix units in one group – each group's shares come from its own total.
- Don't use it for more than three groups; a page of mixes reads better as a table.

## Example

```html
<tc-audience-mix id="mix"></tc-audience-mix>

<script type="module">
  import "trenchcoat/audience-mix";
  import "trenchcoat/tokens.css";

  const mix = document.querySelector("#mix");
  mix.sectors = [{ label: "Academic", value: 54 }, { label: "Industry", value: 23 }, { label: "Government", value: 14 }];
  mix.split = { internal: 6, external: 94 };
  mix.places = [{ label: "United States", value: 38 }, { label: "Other", value: 62 }];
</script>
```

```tsx
import { AudienceMix } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Readers() {
  return (
    <AudienceMix
      sectors={[{ label: "Academic", value: 54 }, { label: "Industry", value: 23 }, { label: "Government", value: 14 }]}
      split={{ internal: 6, external: 94 }}
      places={[{ label: "United States", value: 38 }, { label: "Other", value: 62 }]}
    />
  );
}
```
