---
pattern: toolbar
status: new
related: process-list, terminal, session-panel, segmented-control
---

## Overview

A browser pane around a page the app supplies: back, forward and reload, an address field, a phone / tablet / desktop
switch, a console count and a button to open the page in a new window, with optional tabs. By default it shows `src` in
a sandboxed iframe. Any children the page puts inside the element are shown instead, such as a mock page, a canvas or a
screenshot, and they stay where the page put them.

Phone and tablet are drawn at 375 and 768 CSS pixels and zoomed down to fit the pane, centred, with the size shown under
them. Loading, error and empty states are the page's to set.

## When to use

- Previewing the app a session is building, beside its terminal and processes.
- Showing one page at several widths without leaving the panel.

## When not to use

- Embedding a third-party site for people to use – a plain `iframe` with its own policy is clearer.
- A list of servers to start and stop – use `process-list`.
- Showing an image of a page with no toolbar – use an image.

## Anatomy

1. **Tabs** `.ui-pvf__tabs` – open pages, with New tab, when `tabs` is given
2. **Toolbar** `.ui-pvf__bar` – back, forward and reload, the address, the widths, the console and open externally
3. **Address** `.ui-pvf__address` – its icon says secure, local or not secure
4. **Widths** `.ui-pvf__vps` – a radio group of phone, tablet and desktop
5. **Console** `.ui-pvf__console` – error and warning counts, when `consoleCount` is given
6. **Page area** `.ui-pvf__stage` – the iframe `.ui-pvf__frame`, the page's children, or a notice
7. **Loading bar** `.ui-pvf__progress` – runs while `loading`
8. **Notice** `.ui-pvf__notice` – "Couldn't load …" with Retry, or "No preview running" with Start
9. **Size** `.ui-pvf__size` – the width and zoom, at phone and tablet

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
`bare` drops the tray and card. A page can set `--tc-pvf-inset`, the gap around a phone or tablet, and
`--tc-pvf-backdrop`, the colour behind it.

Below about 30rem, as in a side panel, the address takes its own line under the buttons.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the toolbar: buttons, address, widths, console, open externally |
| Enter | In the address, goes there |
| Escape | In the address, puts back the current address |
| ← / → | In the widths or the tabs, chooses the previous or next |
| Home / End | In the widths or the tabs, chooses the first or last |
| Delete / Backspace | On a tab, closes it |

The tabs and the widths are one tab stop each.

## Screen readers

Every icon button has its name in screen-reader text: "Back", "Reload", "Phone". The address field is labelled
"Address" and the icon beside it says "Secure", "Local" or "Not secure". The widths are a radio group named "Viewport";
the tabs a tab list named "Pages", whose close buttons are for the pointer only – Delete closes a tab from the
keyboard. The console button reads its counts, such as "2 errors, 1 warning". The iframe is titled by the tab or the
heading. The page area is `aria-busy` while loading, and a load failure is an alert.

## Content

- Give each tab a short `title` people would say: "Freezers", "Samples".
- Set `error` to what went wrong and what to do next: "The dev server stopped answering. Restart it, then retry."
- Keep `src` on the app's own dev server; only http, https and about:blank are loaded.

## Do

- Listen for `tc-navigate`, `tc-back`, `tc-forward` and `tc-reload` and drive the page, then pass `loading`,
  `canGoBack` and `canGoForward`.
- Pass a narrower `sandbox` when the page doesn't need scripts or forms.
- Prevent `tc-close` and update `tabs` yourself when the page owns the list.

## Don't

- Don't load pages you don't trust with `allow-same-origin` and `allow-scripts` together: the page could reach out of
  the sandbox.
- Don't rely on the frame to report errors from another origin; the browser hides them, so the page sets `error`.

## Example

```html
<tc-preview-frame id="preview" src="http://localhost:5173/" viewport="phone"></tc-preview-frame>

<script type="module">
  import "trenchcoat/preview-frame";
  import "trenchcoat/tokens.css";

  const el = document.querySelector("#preview");
  el.consoleCount = { errors: 0, warnings: 2 };
  el.addEventListener("tc-reload", () => {
    el.src = "";
    requestAnimationFrame(() => (el.src = "http://localhost:5173/"));
  });
  el.addEventListener("tc-open-external", (e) => window.open(e.detail.url));
</script>
```

```tsx
import { PreviewFrame } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Preview({ running, onStart }: { running: boolean; onStart: () => void }) {
  return (
    <PreviewFrame
      src={running ? "http://localhost:5173/" : ""}
      startable
      defaultViewport="tablet"
      onTcStart={onStart}
      onTcOpenExternal={(e) => window.open(e.detail.url)}
    />
  );
}
```
