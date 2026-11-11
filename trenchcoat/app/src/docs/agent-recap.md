---
pattern: list
status: new
related: away-summary, agent-inbox, digest, background-tasks
---

## Overview

What your agents did while you were away, for a home page. On top, a small chart of the period: a quiet bar for every
15 or 30 minutes, stacked by what happened – done, failed, needs you – with a marker over each notable event; point at
or focus one to see what it was. Below, a board in three columns – Needs you, Failed, Done – acted on in place: Approve
and Retry send the item gliding out, Open follows its link. The header says when the period began ("Since 6:40 PM
yesterday"), the totals, and offers Clear done.

Its neighbours cover parts of this. Agent Inbox has a recap view, but it's a view of the inbox's own tasks, inside the
inbox. Away Summary is the small catch-up at the top of one chat thread. Digest summarises information for reading,
not work to act on. Agent Recap is the morning page: the whole night at a glance, from events and items the page
passes in.

## When to use

- A home or dashboard page people open first thing, after agents ran overnight or over a weekend.
- The shape of the period matters – when the failures came, whether the work bunched up.
- Some of it needs a decision or a retry, and people should act without opening each item.

## When not to use

- The catch-up for one chat thread, above the conversation – use `away-summary`.
- Everything your agents are doing right now, as a live board – use `agent-inbox`.
- Long-running jobs with progress, cancel and retry – use `background-tasks`.

## Anatomy

1. **Header** – the shared card header: a moon, the heading, since when, the totals and Clear done
2. **Chart** `.ui-arcp__chart` – a bar per bin `.ui-arcp__bin`, stacked by kind, with the start and end times and a legend
3. **Marker** `.ui-arcp__marker` – one per notable event, above the bar it falls in; the caption `.ui-arcp__caption` says what it was
4. **Column** `.ui-arcp__col` – Needs you, Failed or Done, with its count
5. **Item** `.ui-arcp__item` – a mark for its status, what happened, why, the agent and time, and its buttons

## Looks

Standard puts the header on the gray tray, the chart on a white card and the three columns as white cards below it.
Clean is one white card: the chart under the header, then the columns as quiet gray lanes. In both, done bars are a
quiet gray and failed and needs-you bars take their status colours; markers and items pair the colour with a shape –
an exclamation, a cross or a check.

The page can set `--tc-arcp-done`, `--tc-arcp-failed` and `--tc-arcp-needs`, the bars' colours.

## Keyboard

| Key | What it does |
|---|---|
| Tab / Shift Tab | Moves to the chart's markers (one stop), Clear done, and each item's buttons |
| ← → ↑ ↓ | On a marker: the previous or next notable event |
| Home / End | On a marker: the first or last event |
| Enter / Space | Acts on the focused button |

## Screen readers

The recap is a `section` named by its heading. The bars are drawn only (`aria-hidden`); the markers are a `group`
named "What happened, Since 6:40 PM yesterday", each a button that says what happened, its kind and time: "Tax ID check
timed out – Failed, 8:15 PM". Each column is a `section` named by its label and count, holding a list. An item's
buttons include what they act on: "Retry: Tax ID check". When an item glides out and had focus, focus moves to the
board.

## Content

- Pass every event in `events`, even the dull ones – the bars show the shape of the night.
- Give failures and questions a `label`; they get markers by default. Mark a done event `notable` when it matters.
- Write items as what happened: "Tax ID check for 3 suppliers". Put the reason in `detail`.
- Keep the board to what someone might act on today; link out with `href` for the rest.

## Do

- Remove an item from `items` once its approval or retry is under way – it has already glided out.
- Set `since` to when the person last looked, so the period is theirs.
- Use `bin-minutes` when the period is unusual – a weekend reads better in hours.

## Don't

- Don't put live, running work here – the recap is about what already happened.
- Don't mark every event notable; a marker per event is noise.
- Don't use it inside a chat thread – it's a page, not a message.

## Example

```html
<tc-agent-recap id="recap" heading="Overnight recap"></tc-agent-recap>

<script type="module">
  import "@adamstavely/trenchcoat/agent-recap";
  import "@adamstavely/trenchcoat/tokens.css";

  const recap = document.querySelector("#recap");
  recap.since = lastSeenAt;
  recap.events = activity.map((a) => ({ at: a.at, kind: a.kind, label: a.summary }));
  recap.items = [
    { id: "n1", status: "needs-you", title: "Publish the draft audit summary?", agent: "Report agent" },
    { id: "f1", status: "failed", title: "Tax ID check for 3 suppliers", detail: "The registry timed out" },
    { id: "d1", status: "done", title: "Classified 412 scanned contracts", href: "/contracts" },
  ];
  recap.addEventListener("tc-item-action", (e) => agents.act(e.detail.id, e.detail.action));
</script>
```

```tsx
import { AgentRecap, type RecapEvent, type RecapItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function MorningRecap({ since, events, items, act }: { since: number; events: RecapEvent[]; items: RecapItem[]; act: (id: string, action: string) => void }) {
  return <AgentRecap title="Overnight recap" since={since} events={events} items={items} onItemAction={(action, item) => act(item.id, action)} />;
}
```
