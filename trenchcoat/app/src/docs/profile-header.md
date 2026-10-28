---
pattern: tabs
status: new
related: person-links, profile-menu, project-card, stories
---

## Overview

The top of a person's or an account's page. It shows a picture or initials, the name, a status pill and any tags,
the other names the person or account goes by, and a line of short facts such as a role, a place, when they were last
seen or a linked case. The page's actions sit at the right, with an optional overflow button for the rest. A row of
tabs underneath can switch between the sections of the page. Narrow, the actions drop under the name and the tabs
scroll sideways.

## When to use

- The header of a customer, contact, employee, patient or case-subject page.
- An account, company or workspace page – set `kind="account"` for a square avatar.
- Any record page whose sections are tabs below the header.

## When not to use

- The signed-in user's own menu in an app bar – use `profile-menu`.
- A project's summary in a grid of cards – use `project-card`.
- What changed for a person since you last looked – use `stories`.
- The people linked to this one – put `person-links` under the header.

## Anatomy

1. **Avatar** `.ui-phd__avatar` – the picture, or the name's initials; round for a person, square for an account
2. **Name** `.ui-phd__name` – the page's heading, level 2 by default
3. **Pills** `.ui-phd__pill` – the status, with a dot, then any tags
4. **Other names** `.ui-phd__aliases` – “Also known as” and a chip for each name
5. **Facts** `.ui-phd__meta` – short facts in one line, separated by dots; a fact can carry a coloured dot
6. **Actions** `.ui-phd__actions` – the page's buttons, and the overflow button
7. **Tabs** `.ui-phd__tabs` – the page's sections, with optional counts

## Looks

Standard is a white card on a gray tray, with the selected tab underlined in ink. Clean is one white card, and the
selected tab is underlined in the accent. The avatar, pills, chips and actions are the same in both.

## Keyboard

The actions are ordinary buttons in the tab order. The tabs are one tab stop, on the selected tab.

| Key | What it does |
|---|---|
| ← / → | Moves to the previous or next tab, wrapping at the ends |
| Home / End | Moves to the first or last tab |
| Enter / Space | Selects the focused tab |
| Tab | Leaves the tabs; the tab stop goes back to the selected tab |

Tabs are selected by Enter, Space or a click, not by moving between them, so a page whose sections load slowly isn't
asked for each one on the way.

## Screen readers

The name is a heading, level 2 by default; set `level="1"` when the header tops the page. The avatar is decorative.
The pills, other names and facts are read as text; the other names are a list labelled “Also known as”. An action
reads its label, and the overflow button reads “More actions”. The tabs are a `tablist` labelled “Sections”: each tab
reads its label and count, and the selected tab is `aria-selected`. Give a tab `controls`, the id of its panel, for
`aria-controls`, and label the panel with the tab's id: `tc-phd-1-tab-overview` for the first header's overview tab.

## Content

- Use the name people will search for; put other spellings and former names in `aliases`.
- Keep the status to one or two words: “Active”, “Under review”, “Closed”.
- Keep facts short and in a fixed order across pages: role, place, since when, then links.
- Make one action primary at most – the thing most people come to the page to do.

## Do

- Put rarely used actions behind the overflow button with `more`, and open your own menu on `tc-action` “more”.
- Show counts on tabs whose sections hold lists, so people can see what's there before opening them.
- Use a tone on a fact only when it matters right now, such as an open case.

## Don't

- Don't add more than about four pills – past that, none of them stands out.
- Don't use colour alone for the status – the label always says it.
- Don't put the page's search or filters in the header – they belong to the section below.

## Example

```html
<tc-profile-header id="header" name="Dana Whitfield" more></tc-profile-header>

<script type="module">
  import "trenchcoat/profile-header";
  import "trenchcoat/tokens.css";

  const header = document.querySelector("#header");
  header.status = { label: "Enhanced review", tone: "warning" };
  header.aliases = ["D. Ross"];
  header.meta = ["Retail customer", "Leeds, UK", { label: "Case KYC-2291", tone: "warning" }];
  header.actions = [{ id: "flag", label: "Flag for review", icon: "flag", variant: "primary" }];
  header.tabs = [{ id: "overview", label: "Overview" }, { id: "documents", label: "Documents", count: 9 }];
  header.addEventListener("tc-action", (e) => console.log(e.detail.id));
  header.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected));
</script>
```

```tsx
import { useState } from "react";
import { ProfileHeader } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function CustomerHeader() {
  const [tab, setTab] = useState("overview");
  return (
    <ProfileHeader
      name="Dana Whitfield"
      status={{ label: "Enhanced review", tone: "warning" }}
      meta={["Retail customer", "Leeds, UK"]}
      actions={[{ id: "flag", label: "Flag for review", icon: "flag", variant: "primary" }]}
      tabs={[{ id: "overview", label: "Overview" }, { id: "documents", label: "Documents", count: 9 }]}
      selected={tab}
      onSelectedChange={setTab}
      onAction={(id) => console.log(id)}
    />
  );
}
```
