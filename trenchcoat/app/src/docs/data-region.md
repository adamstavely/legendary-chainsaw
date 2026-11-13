---
pattern: form
status: new
related: data-controls, data-handling-policy, status-tracker, stepper-form
---

## Overview

Where a workspace's data lives, and a safe way to move it. The top of the card names the region the data is in now and,
item by item, what's stored there and what isn't – "Model processing: outside this region" matters as much as
"Conversations: in this region". Below it, a short flow moves the data. Choose a region from radio cards that give its
latency and what isn't available there yet ("large-1 not yet available in AP – Sydney"). See the impact: the downtime
window, what's re-indexed, and features that won't be there. Schedule a date, time and time zone. Confirm by typing the
workspace's name. Then follow the migration's steps, each with a mark and a word.

## When to use

- An admin page for data residency in an AI product.
- Moving a workspace's data to another region, when the move has downtime or loses features.
- Showing, plainly, which parts of a workspace's data leave the region.

## When not to use

- A person's own settings for training, history and export – use `data-controls`.
- Retention, logs and deletion rules for a workspace – use `data-handling-policy`.
- A long job's progress on its own – use `status-tracker`.
- A general multi-step form – use `stepper-form`.

## Anatomy

1. **Where it lives** `.ui-drg__current` – the current region, and each item with where it's stored (`.ui-drg__item`)
2. **Steps** `.ui-drg__steps` – Choose, Impact, Schedule, Confirm and Progress; "Step 2 of 5 · Impact" when narrow
3. **Region choice** `.ui-drg__choice` – a radio card with latency, a note and what's unavailable there
4. **Impact** `.ui-drg__impact` – downtime, what's re-indexed and features that won't be there
5. **Schedule** `.ui-drg__schedule` – date, time and time zone
6. **Confirmation** `.ui-drg__summary` – the move in one sentence, and the workspace's name to type
7. **Progress** `.ui-drg__progress` – the migration's steps, each with a mark and a word
8. **Actions** `.ui-drg__actions` – Back, and Next or Start migration

## Looks

Standard is a white card on a gray tray, with the header on the tray. Clean is one white card with the header as its
first row. The step marks' size is the component token `--tc-drg-step`, and the chosen card's ring is `--tc-drg-ring`.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves between the regions, fields and buttons |
| Arrow keys | Move between regions (native radio buttons) |
| Enter | In the confirmation field, starts the migration |

When the step changes, focus moves to the new step's title. A missing answer moves focus to the field to fix.

## Screen readers

The regions are a group of native radio buttons named "Move the data to"; the current region can't be chosen and says
"Current". What's unavailable in a region is part of its name. A missing answer is said in words, linked to its field
with `aria-describedby` and marked `aria-invalid`. The steps list marks the current one with `aria-current="step"`.
During the move, each new active or failed step is announced once ("Copying data: In progress"). Where an item is
stored is said in words, not only by its mark.

## Content

- Name regions the way people know them: "EU – Frankfurt".
- Say what leaves the region, not just what stays: model processing, backups, support access.
- Give the downtime as people will feel it: "About 2 hours of read-only time".
- Use the workspace's real name for the confirmation, so people know which workspace they're moving.

## Do

- Fill `impact` for the chosen region from your back end before the Impact step.
- Update `progress` as the migration runs; the element announces each new step.
- Keep moves cancelable in your system until Start migration.

## Don't

- Don't let people choose the region the data is already in; the card marks it as current.
- Don't skip the impact step for a move that loses features.
- Don't hide model processing outside the region – list it in `stored` with `inRegion: false`.

## Example

```html
<tc-data-region id="region" workspace="Halvorsen Research" current="eu-fra"></tc-data-region>

<script type="module">
  import "@adamstavely/trenchcoat/data-region";
  import "@adamstavely/trenchcoat/tokens.css";

  const card = document.querySelector("#region");
  card.regions = [
    { id: "eu-fra", name: "EU – Frankfurt", latency: "About 20 ms" },
    { id: "eu-dub", name: "EU – Dublin", latency: "About 35 ms" },
    { id: "ap-syd", name: "AP – Sydney", latency: "About 290 ms", unavailable: ["large-1"] },
  ];
  card.stored = [
    { label: "Conversations", inRegion: true },
    { label: "Model processing", inRegion: false, note: "Runs in the EU and US" },
  ];
  card.impact = { downtime: "About 2 hours of read-only time", reindexed: ["Search index"] };
  card.addEventListener("tc-migrate", (e) => console.log("move to", e.detail.region, "at", e.detail.at, e.detail.timeZone));
</script>
```

```tsx
import { useState } from "react";
import { DataRegion, type DataRegionOption, type DataRegionProgressStep, type DataRegionStep } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Residency({ regions, progress }: { regions: DataRegionOption[]; progress: DataRegionProgressStep[] }) {
  const [step, setStep] = useState<DataRegionStep>("choose");
  return (
    <DataRegion
      title="Data region"
      workspace="Halvorsen Research"
      current="eu-fra"
      regions={regions}
      stored={[{ label: "Conversations", inRegion: true }]}
      step={step}
      onStepChange={setStep}
      progress={progress}
      onMigrate={(m) => console.log("migrate", m.region, m.at, m.timeZone)}
    />
  );
}
```
