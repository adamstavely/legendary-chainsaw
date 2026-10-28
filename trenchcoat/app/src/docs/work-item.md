---
pattern: none
status: new
related: org-unit-card, project-card, usage-meter, background-tasks
---

## Overview

One piece of work as a card, made to sit in a grid with others. It shows:

- **Title and status.** The status is in words and a mark: Active, Blocked, In review, Done or Paused, all renamable.
- **Note and progress.** A one-line note (the blocker or the next step), then progress with its %.
- **Due date, people and outcome.** The due date is marked once it's passed. The people on it are initials, and what
  it delivers is a tag, e.g. “fills 1 gap”.
- **Money and effort.** Spent against budget, with a slim bar and an “over budget” note when it's past. Then the
  effort, e.g. “1.5 FTE”.
- **Source.** For work mirrored from another system, a badge like “Synced · read-only”.

The title is the card's one control, and the whole card is its target. It's a link when `href` is set, otherwise a
button, and either way opening it fires tc-open.

## When to use

- The work against a topic, a goal or a gap, laid out as a grid.
- A summary of work tracked in another system, mirrored read-only.
- Anywhere progress, deadline and spend matter together for each item.

## When not to use

- A whole unit and its teams – use `org-unit-card`.
- A project with its subtasks and a status you change in place – use `project-card`.
- Use against a plan's limit – use `usage-meter`.
- Long-running jobs with cancel and retry – use `background-tasks`.

## Anatomy

1. **Title** `.ui-wki__title` – the work's name, and the card's link or button
2. **Status** `.ui-wki__status` – Active, Blocked, In review, Done or Paused, in words and a mark
3. **Note** `.ui-wki__note` – one line: the blocker, the next step
4. **Progress** `.ui-wki__progress` – how far along, with its %
5. **Due** `.ui-wki__due` – the due date, “Overdue” once it's passed
6. **People** `.ui-wki__people` – initials of who's on it
7. **Outcome** `.ui-wki__outcome` – what it delivers, as a tag
8. **Money** `.ui-wki__money` – spent against budget, with a slim bar
9. **Source** `.ui-wki__source` – where a mirrored item comes from

## Looks

Both looks are a white card. Standard lifts it with the card shadow and a medium-weight title. Clean uses the quieter
Clean shadow and a lighter title. The content is the same in both.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the card's title; the whole card shows the focus ring |
| Enter | Opens the card (a link follows unless tc-open is prevented) |
| Space | Opens the card when it's a button |

## Screen readers

The card's title is a level-4 heading containing its link or button, so the card's name is the work's title. The
status reads “Status: Blocked”. Progress is a `progressbar` labelled “Progress” with its value. The due date reads
“Due Aug 15”, or “Overdue · Jun 30” when it's passed. The people are an image named “People: Jonah Tran, Elena
Castellanos”. Money reads “$360K / $600K spent”, or “… · over budget”. The marks and bars are hidden; their meaning
is always in words.

## Content

- Write the title as the work's name, not its ticket number: “NeuroBench-E harness”.
- Use the note for the one thing people need to know now – the blocker, the next step – in a sentence.
- Keep the outcome short and countable: “fills 1 gap”, “ships v2”.
- Pass `currency` when budgets aren't in dollars; amounts are shortened, “$1.9M”.

## Do

- Lay cards out in a grid with columns of at least 240 px.
- Pass `now` when the page has its own sense of today, such as a report as of a date.
- Set `source` on items mirrored from another system, so nobody tries to edit them here.

## Don't

- Don't put a second button or link inside the card – the whole card is the title's target.
- Don't use the status colours for anything but status.
- Don't show money on items people can't act on; leave `spent` and `budget` unset instead.

## Example

```html
<tc-work-item id="work" heading="NeuroBench-E harness" status="active" href="/work/neurobench" effort="1.5 FTE"></tc-work-item>

<script type="module">
  import "trenchcoat/work-item";
  import "trenchcoat/tokens.css";

  const work = document.querySelector("#work");
  work.progress = 0.6;
  work.due = Date.parse("2026-08-15T12:00");
  work.people = [{ name: "Jonah Tran" }, { name: "Elena Castellanos" }];
  work.spent = 360000;
  work.budget = 600000;
  work.addEventListener("tc-open", (e) => console.log("open", e.detail.href));
</script>
```

```tsx
import { WorkItem } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Harness() {
  return (
    <WorkItem
      title="NeuroBench-E harness"
      status="active"
      note="Energy-normalised benchmark across 7 substrates."
      progress={0.6}
      due={Date.parse("2026-08-15T12:00")}
      people={[{ name: "Jonah Tran" }, { name: "Elena Castellanos" }]}
      outcome="fills 1 gap"
      spent={360000}
      budget={600000}
      effort="1.5 FTE"
      onOpen={(href) => console.log("open", href)}
    />
  );
}
```
