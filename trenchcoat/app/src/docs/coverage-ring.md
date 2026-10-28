---
pattern: none
status: new
related: gap-exposure, priority-list, usage-meter, kpi-chart
---

## Overview

One share at a glance. A large ring fills to the value, with the percentage in its middle over a caption – “covered”
by default – and a title and a line beside it saying what the share measures. Beneath, an optional bar splits the
items from the healthiest to those that need attention: segments the page names, each sized by its count and drawn in
a tone, with the bar's two ends labelled. Pointing at or focusing a segment reads it out under the bar. When the value
changes, the ring fills to it smoothly.

## When to use

- A portfolio's headline share – gaps with work against them, controls in place, tests passing.
- A dashboard panel beside a list that explains the number, such as `gap-exposure`.
- Showing how the items behind a share spread from healthy to needing attention.

## When not to use

- Use against a limit or a plan – use `usage-meter`.
- A number's trend over time – use `kpi-chart`.
- The gaps themselves – use `gap-exposure`.
- Items ranked with their own coverage – use `priority-list`.

## Anatomy

1. **Ring** `.ui-covr__ring` – filled to the value, in its tone
2. **Percentage** `.ui-covr__num` – the value, with the caption under it
3. **Title** `.ui-covr__title` – what the share is
4. **Description** `.ui-covr__desc` – one line on what it measures
5. **Bar** `.ui-covr__bar` – the segments from healthiest to needs attention, each sized by its count
6. **Ends** `.ui-covr__ends` – the bar's end labels, or the segment under the pointer or focus

## Looks

Standard is a white card on a gray tray. Clean is one white card. The ring, bar and text are the same in both.

## Keyboard

The segments are one tab stop.

| Key | What it does |
|---|---|
| ← / → | Moves to the previous or next segment |
| Home / End | Moves to the first or last segment |
| Enter / Space | Fires `tc-select` with the segment |
| Tab | Leaves the bar |

## Screen readers

The ring is an image named by its value and caption, “61% covered”; the percentage in the middle repeats it and is
hidden. The title is a heading. The bar is a group named by the title, and each segment a button that reads its label,
count and share, “Uncovered: 1 topics, 8%”. The readout under the bar repeats the focused segment and is hidden.

## Content

- Set `unit` to what the segments count, plural, and `unit-one` to its singular: “topics” and “topic”.
- Keep the title short, the name of the share: “Gap coverage”.
- Say what's counted in the description, so the number can't be misread: “Share of open gaps with active work
  assigned.”
- Order `segments` from healthiest to needing most attention, and name them as states: “Well covered”, “Thin”.
- Set `unit` to what the segments count: “topics”, “teams”.

## Do

- Use the success tone for a share where more is better, and a status tone that matches when it isn't.
- Keep segments to five or fewer so each stays wide enough to point at.
- Put the list that explains the share next to it.

## Don't

- Don't show a share that can go above 100% – it's clamped.
- Don't use the ring for a count; it's for a share of a whole.
- Don't add segments that don't add up to the items behind the share.

## Example

```html
<tc-coverage-ring id="cov" heading="Gap coverage" description="Share of open gaps with active work assigned." value="0.61" unit="topics" unit-one="topic"></tc-coverage-ring>

<script type="module">
  import "trenchcoat/coverage-ring";
  import "trenchcoat/tokens.css";

  const cov = document.querySelector("#cov");
  cov.segments = [
    { id: "strong", label: "Well covered", count: 5, tone: "success" },
    { id: "thin", label: "Thin", count: 2, tone: "warning" },
    { id: "bare", label: "Uncovered", count: 1, tone: "danger" },
  ];
  cov.addEventListener("tc-select", (e) => console.log(e.detail.id));
</script>
```

```tsx
import { CoverageRing, type CoverageSegment } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const segments: CoverageSegment[] = [
  { id: "strong", label: "Well covered", count: 5, tone: "success" },
  { id: "thin", label: "Thin", count: 2, tone: "warning" },
  { id: "bare", label: "Uncovered", count: 1, tone: "danger" },
];

export function GapCoverage() {
  return <CoverageRing title="Gap coverage" description="Share of open gaps with active work assigned." value={0.61} unit="topics" unitOne="topic" segments={segments} onSegmentSelect={(id) => console.log(id)} />;
}
```
