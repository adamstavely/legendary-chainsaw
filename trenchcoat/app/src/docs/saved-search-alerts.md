---
pattern: list
status: new
related: search-history, routine-form, results-list, notifications
---

## Overview

Saved searches that tell people when something new matches. Each alert shows its name and query, how many new
matches there are ("12 new since Tue" – a button that opens them) and when it last checked. It also shows how often
it checks (Instant, Daily, Weekly or Off) and where it tells people (email, in the app, Slack – a toggle each). Pause
and Resume, Run now and Remove (with Undo) sit at the end. At the foot, Add alert takes a name, a query and how
often; `draft-query` fills the query in from the search someone just ran.

## When to use

- Beside search results, to keep watching a search.
- A settings page listing what someone is subscribed to.

## When not to use

- A search to run again by hand – use [Search History](#/search-history).
- A scheduled task with instructions – use [Routine Form](#/routine-form).
- The messages the alerts send – use [Notifications](#/notifications).

## Anatomy

1. **Alert** `.ui-ssa__alert` – the name, the query and the new matches
2. **New matches** `.ui-ssa__new` – how many, since when; opens them
3. **Controls** `.ui-ssa__controls` – how often, the channels, Pause, Run now and Remove
4. **Undo** `.ui-ssa__removed` – after a removal, until the next one
5. **Add alert** `.ui-ssa__add` – a name, the search and how often

## Looks

Standard puts the header on a gray tray above a white card; Clean is one white card. A paused or Off alert's name is
quieter, with a Paused pill. The channels are pressed toggles. Add alert sits on a soft fill at the foot and stacks
in a narrow column.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Through each alert's controls, then Add alert |
| Space / Enter on a channel | Turns it on or off |
| ↑ / ↓ on How often | Changes it |
| Enter in Add alert | Adds the alert |

## Screen readers

- The alerts are a list; each alert's controls are a group named by the alert.
- Channels are pressed buttons. The new-matches button says which alert it opens, and Remove says which alert goes.
- Changes are announced in a polite status line, and focus moves to Undo after a removal.

## Content

- Name an alert after what it watches ("New bleaching surveys"), not the query's words.
- Default to Daily – Instant is for things that can't wait.

## Do

- Keep `newCount` honest: reset it when the person has opened the matches.
- Prefill Add alert from the current search with `draft-query`.

## Don't

- Turn on every channel by default.
- Remove alerts without Undo.

## Example

```html
<tc-saved-search-alerts draft-query="seagrass carbon"></tc-saved-search-alerts>
<script type="module">
  const alerts = document.querySelector("tc-saved-search-alerts");
  alerts.alerts = [{ id: "a1", name: "Bleaching surveys", query: "coral bleaching survey", frequency: "daily", channels: ["email"], newCount: 12 }];
  alerts.addEventListener("tc-alerts-change", (e) => console.log("save", e.detail.alerts));
</script>
```

```tsx
import { useState } from "react";
import { SavedSearchAlerts, type SearchAlert } from "trenchcoat/react";

export function Alerts() {
  const [alerts, setAlerts] = useState<SearchAlert[]>([]);
  return <SavedSearchAlerts alerts={alerts} onAlertsChange={setAlerts} onOpenMatches={(a) => console.log("open", a.id)} />;
}
```
