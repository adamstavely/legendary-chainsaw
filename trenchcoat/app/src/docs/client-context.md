---
pattern: tabs
status: new
related: kpi-chart, comment-thread, chat-history, context-tray, segmented-control
---

## Overview

One client's workspace for an accounting, advisory or agency team. The header names the client and shows when their
books last synced, with a button to sync now and a switcher to open another client or create one. Four KPI cards sit
under it, each with a sparkline; picking one opens that metric under Financials.

The main card has four sections:
- **Context** – a timeline of notes, files, generated reports and connected apps that the whole team writes into.
  Search it, filter it by kind, write a note, mention a report with “@”, attach files and add it with ⌘ Enter.
- **Reports** – the client's generated reports, each opening to its summary with Mention in context and Regenerate.
- **Financials** – every KPI with last month's value and the change, the picked one marked.
- **Settings** – the Stripe connection and the client's switches.

Context added or removed here is kept per client until the page passes a different context for that client – then
the page's data wins.

## When to use

- A client or account page where the team needs the numbers and the shared notes side by side.
- Advisory and bookkeeping tools that keep goals, decisions and source files with each client.
- Any workspace where people switch between a handful of accounts all day.

## When not to use

- A single chart of one metric – use `kpi-chart`.
- A discussion thread on one item – use `comment-thread`.
- Files and context attached to an AI conversation – use `context-tray`.
- A list of past conversations – use `chat-history`.

## Anatomy

1. **Header** `.ui-cx__head` – the client's mark, name and details, Sync now and Switch client
2. **Client menu** `.ui-cx__menu` – the clients, and New client
3. **KPI card** `.ui-cx__kpi` – a metric's value and sparkline; opens it under Financials
4. **Sections** `.ui-cx__seg` – Context, Reports, Financials and Settings
5. **Search** `.ui-cx__search` – filters the timeline
6. **Filter** `.ui-cx__filter-btn` – shows one kind of entry
7. **Note box** `.ui-cx__composer` – a note with mentions and attached files
8. **Timeline entry** `.ui-cx__item` – a note, files, a report or a connected app
9. **Mention** `.ui-cx__mention` – a mentioned report; opens it
10. **Report** `.ui-cx__report` – a report that opens to its summary and actions

## Looks

Standard puts the header on a gray tray, with the KPI cards and the main card as white cards on it. Clean is one
white card: the KPIs are quiet outlined tiles and the sections sit below a hairline. The buttons and the section tabs
are `tc-button` and `tc-segmented-control` in the same look.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the header, KPI cards, sections, search and the timeline's buttons |
| ↑ / ↓ | In the client or filter menu, moves between items |
| Home / End | In a menu, moves to the first or last item |
| Enter / Space | Opens a menu, picks an item, opens a report or metric |
| Esc | Closes a menu and returns focus to its button; closes the mention suggestions |
| ← / → | Moves between the sections |
| ⌘ Enter / Ctrl Enter | Adds the note |
| Enter / Tab | While mention suggestions show, inserts the first one |

When something under focus goes away – a removed note or file, Clear search, Show everything – focus moves to the
nearest control that stays.

## Screen readers

The sections are tabs that control one tab panel named after the open section. The sync button is named by what it
shows plus what pressing does: “Synced 3m ago, sync now”, and the result (“Synced just now”) is announced in a status
region. The switcher and filter buttons report `aria-expanded`; the current client and filter are marked with
`aria-current` and `aria-pressed`. Mention suggestions are announced: “2 reports to mention – Enter inserts Monthly
P&L”. A collapsed report's body is `inert`, so its buttons aren't reached. Switches in Settings use `role="switch"`.

## Content

- Put the legal name, currency and fiscal year end in `meta`: it's what people check before they trust a number.
- Write `when` as people say it – “today”, “2d ago”.
- Name reports so they read well after “@”: “Monthly P&L”, “Cash runway”.
- Keep notes to goals, requests and decisions; attach the files that back them.

## Do

- Persist added context from `tc-add-context` and pass the client's new `context` back.
- Pass `me`, so people can remove their own notes.
- Keep the KPI list to four, the same four for every client.

## Don't

- Don't use colour alone to tell kinds apart – each entry has its own icon and words.
- Don't put more than a few hundred entries in one client's timeline; page older ones.
- Don't rely on the demo's sync and regenerate timers – wire them to your own jobs.

## Example

```html
<tc-client-context id="client"></tc-client-context>

<script type="module">
  import "trenchcoat/client-context";
  import "trenchcoat/tokens.css";

  const client = document.querySelector("#client");
  client.me = { name: "Sofia Lind" };
  client.addEventListener("tc-add-context", (e) => console.log("add", e.detail.client, e.detail.text, e.detail.files));
  client.addEventListener("tc-client-change", (e) => console.log("client", e.detail.client));
</script>
```

```tsx
import { useState } from "react";
import { ClientContext, defaultContextClients } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Clients() {
  const [client, setClient] = useState("northwind");
  return (
    <ClientContext
      clients={defaultContextClients}
      client={client}
      onClientChange={setClient}
      me={{ name: "Sofia Lind" }}
      onAddContext={(id, text, files) => console.log(id, text, files.length)}
    />
  );
}
```
