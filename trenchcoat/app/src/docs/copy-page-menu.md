---
pattern: menu
status: new
related: code-block, share-link-manager, api-reference-nav, command-menu
---

## Overview

The Copy page button at the top of a docs page, for handing the page to a model. The button copies the page as
Markdown – from `markdown`, or from the async `getMarkdown()` when the page makes it on demand (its answer is kept).
The arrow beside it opens a menu: Copy as Markdown, View as Markdown (a dialog with the text, to read or copy part
of), Copy link, Open in each chat assistant the page lists, and Download .md. An assistant is opened with "Read
&lt;url&gt; and help me with it" in place of `{prompt}` in its URL template. "Copied" shows on the button and is
announced. Each action fires a cancelable event first, so a page can do it its own way.

## When to use

- Docs, references and guides that people paste into a chat with a model.
- Any long page where a clean Markdown copy is better than selecting the rendered text.

## When not to use

- Copying one snippet of code – `code-block` has its own Copy.
- Sharing a page with people, with access and expiry – use `share-link-manager`.
- A menu of commands across an app – use `command-menu`.

## Anatomy

1. **Copy** `.ui-cpm__main` – copies the page as Markdown; says "Copied" for a moment
2. **More** `.ui-cpm__more` – the arrow that opens the menu
3. **Menu** `.ui-cpm__menu` – the ways to share the page
4. **Item** `.ui-cpm__item` – one action, with an icon, its name and a short hint
5. **Dialog** `.ui-cpm__dialog` – View as Markdown: the page's title, the text, Copy and Close
6. **Text** `.ui-cpm__text` – the Markdown, scrollable and focusable

## Looks

One look in both Standard and Clean: a split button like the library's small secondary button, and a menu on the
menu tokens. `--tc-cpm-menu-w` sets the menu's width (264px), and `--tc-cpm-dialog-w` and `--tc-cpm-dialog-h` the
dialog's size.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to Copy page, then the arrow |
| Enter / Space on Copy page | Copies the page as Markdown |
| Enter / Space / ↓ on the arrow | Opens the menu on its first item |
| ↑ on the arrow | Opens the menu on its last item |
| ↓ / ↑ | Next or previous item, wrapping round |
| Home / End | First or last item |
| A letter | The next item that starts with it |
| Enter | Does the item's action and closes the menu |
| Escape | Closes the menu and returns to the arrow |
| Tab in the menu | Closes it and moves on |
| Escape in the dialog | Closes it and returns focus |

## Screen readers

The arrow is a button with `aria-haspopup="menu"` and `aria-expanded`, named "More ways to share this page"; the menu
is a `menu` of `menuitem`s, each named by its words. Assistants are links that open in a new tab. "Copied" is
announced politely, and so is a failure ("Couldn't copy – open View as Markdown and copy the text there"). The
dialog is modal, named by its title, and its text is a focusable region you can read line by line.

## Content

- Give `markdown` the page as written – headings, tables and code fences – not the rendered HTML turned back into
  text.
- Give `url` the page's canonical address, not one with a session or a tracking query.
- Name assistants as people know them, and point `urlTemplate` at a new chat with the prompt filled in.
- Keep `page-title` short: it names the dialog and the download ("list-records.md").

## Do

- Use `getMarkdown` when the Markdown is costly to make; it's asked once, on first use.
- Handle `tc-page-copy` yourself if your page needs a clipboard of its own (a desktop shell, say).

## Don't

- Don't add an assistant without a `{prompt}` placeholder – it would open an empty chat.
- Don't put page actions (Edit, Report a problem) in this menu – it's for sharing the page's text.

## Example

```html
<tc-copy-page-menu url="https://docs.example.org/records/list" page-title="List records"></tc-copy-page-menu>

<script type="module">
  import "@adamstavely/trenchcoat/copy-page-menu";
  import "@adamstavely/trenchcoat/tokens.css";

  const menu = document.querySelector("tc-copy-page-menu");
  menu.markdown = "# List records\n\n`GET /v1/records`\n\nReturns the records you can read, newest first.\n";
  menu.assistants = [{ id: "assistant", label: "Institute Assistant", urlTemplate: "https://assistant.example.org/new?q={prompt}" }];
  menu.addEventListener("tc-page-copy", (e) => console.log("copied", e.detail.kind));
</script>
```

```tsx
import { CopyPageMenu } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function PageHeader({ title, url, source }: { title: string; url: string; source: () => Promise<string> }) {
  return (
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <h1>{title}</h1>
      <CopyPageMenu
        pageTitle={title}
        url={url}
        getMarkdown={source}
        assistants={[{ id: "assistant", label: "Institute Assistant", urlTemplate: "https://assistant.example.org/new?q={prompt}" }]}
        onPageCopy={(kind) => console.log("copied", kind)}
      />
    </header>
  );
}
```
