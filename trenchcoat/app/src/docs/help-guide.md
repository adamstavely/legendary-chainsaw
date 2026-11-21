---
pattern: none
status: new
related: help-video, tooltip, tips-panel, setup-guide
---

## Overview

Point-in-time help that lives in the help center: a small guide icon that sits beside a heading, a field label or a toolbar, and links to one written tutorial. It's Help Video's sibling – where a feature is explained in a guide rather than a video, put this beside it instead. Each carries its own guide.

The icon is a page with its corner folded and lines of text cut through it, drawn in the text colour and sized to the text around it. Pointing at it shows a tooltip with the guide's title and how long it takes to read. It's a real link (`href`) and opens the guide in a new tab, or in the same one with `same-tab`. Once the guide has been opened, a small check sits on the icon's bottom corner. When the guide changes, set `updated-on` to the date: a small dot sits on the top-right corner for `new-days` days (14 by default), and the tooltip and name say Updated. Opening the guide clears the dot for that person (`tc-update-seen-change`); pass `update-seen` back to keep it cleared.

Opening fires `tc-guide-open` first, with the guide's `href` and title. It's cancelable: an app that shows guides in its own side panel prevents it and opens the guide there, and the link doesn't navigate. A click with a modifier key – to open a new window or tab – is left to the browser.

## When to use

- A feature, field or screen that has a written guide in the help center.
- Help that belongs where the question comes up, rather than behind a help menu.
- Short, task-shaped guides – one icon, one guide.

## When not to use

- The help is a video – use `help-video`.
- A sentence or two of explanation – use `tooltip`.
- A list of tips or a getting-started checklist – use `tips-panel` or `setup-guide`.

## Anatomy

1. **Link** `.ui-hgd__trigger` – the link, holding `.ui-hgd__mark` with the guide page `.ui-hgd__icon`, `.ui-hgd__seen` once read, and `.ui-hgd__new` – the Updated dot – after a recent change
2. **Label** `.ui-hgd__label` – words beside the icon, when `label` is set
3. **Tooltip** `.ui-hgd__tip` – the title, reading time and Updated, on hover and keyboard focus, when there's no label

## Looks

The icon is the same in Standard and Clean: the text colour, a shade quieter (`--tc-hgd-ink`), turning to the full text colour on hover (`--tc-hgd-ink-hover`). With `label` it becomes a small pill. `size` sets it against the text around it – `sm` 1em for labels and toolbars, `md` 1.25em for section headings, `lg` 1.5em for page titles – and `--tc-hgd-size` takes any length. `--tc-hgd-dot` sets the Updated dot's colour (the accent by default).

## Keyboard

| Key | What it does |
|---|---|
| Tab | Move to the icon; its tooltip shows |
| Enter | Open the guide |

## Screen readers

The icon is a link named "Read guide:" with the title, its reading time, whether it's been read, Updated while the dot shows, and "opens in a new tab" unless `same-tab`. With a `label`, the name starts with the label's words. The drawing, the dot and the tooltip are hidden from assistive technology, because the link's name already says what they show.

## Content

- Title the guide by the task it teaches: "Write a risk rule", not "Help" or "Learn more".
- Give `minutes` as a whole number – "5 min read".
- Link to the guide itself, not the help center's home page.
- Use `label` sparingly – "Read the guide" beside an action people hesitate over.

## Do

- Put the icon right after the words it explains, on the same line.
- Store `read` per person and pass it back, so the checks survive a reload.
- Set `updated-on` only for a change worth re-reading, and store `update-seen` per person and per update, so the dot comes back for the next one.

## Don't

- Don't put one beside every heading – save them for the places people actually get stuck.
- Don't put it inside a `<label>`: its words would become part of the field's name. Put it beside the label instead.

## Example

```html
<h2>
  Risk rules
  <tc-help-guide
    id="rules-help"
    heading="Write a risk rule"
    href="https://help.example.com/guides/risk-rules"
    minutes="5"
    updated-on="2026-11-17"
  ></tc-help-guide>
</h2>

<script type="module">
  import "@adamstavely/trenchcoat/help-guide";
  import "@adamstavely/trenchcoat/tokens.css";

  const help = document.querySelector("#rules-help");
  help.read = localStorage.getItem("guide:rules") === "read";
  help.addEventListener("tc-read-change", () => localStorage.setItem("guide:rules", "read"));
  // The dot clears once this person opens the update; key it by the date so the next update shows again
  help.updateSeen = localStorage.getItem("guide:rules:update") === help.updatedOn;
  help.addEventListener("tc-update-seen-change", () => localStorage.setItem("guide:rules:update", help.updatedOn));
</script>
```

```tsx
import { HelpGuide } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function RulesHeading({ read, onRead, openInPanel }: { read: boolean; onRead: () => void; openInPanel: (href: string) => void }) {
  return (
    <h2>
      Risk rules{" "}
      <HelpGuide
        title="Write a risk rule"
        href="https://help.example.com/guides/risk-rules"
        minutes={5}
        read={read}
        onReadChange={onRead}
        onGuideOpen={(detail, event) => {
          event.preventDefault();
          openInPanel(detail.href);
        }}
      />
    </h2>
  );
}
```
