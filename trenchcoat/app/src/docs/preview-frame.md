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

Set `html` instead of `src` to run HTML a model wrote. It runs in a sandboxed frame that can't reach your page or, by
default, the network. Console errors, uncaught errors and unhandled rejections from it come back to the pane. They feed
the console count and a list of problems under the page, with **Ask to fix** to send them back to the model.

## When to use

- Previewing the app a session is building, beside its terminal and processes.
- Showing one page at several widths without leaving the panel.
- Running HTML, CSS and JavaScript a model just wrote, and catching what breaks so it can be fixed (`html`).

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
10. **Problems** `.ui-pvf__errors` – with `html`, what the page reported: each message `.ui-pvf__error` with its line,
    and Ask to fix `.ui-pvf__fix`

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
`bare` drops the tray and card. A page can set `--tc-pvf-inset`, the gap around a phone or tablet, and
`--tc-pvf-backdrop`, the colour behind it, and `--tc-pvf-errors-h`, the tallest the problems list grows before it
scrolls.

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
| Tab, then Enter | Under the problems from `html`, Ask to fix |

The tabs and the widths are one tab stop each.

## Screen readers

Every icon button has its name in screen-reader text: "Back", "Reload", "Phone". The address field is labelled
"Address" and the icon beside it says "Secure", "Local" or "Not secure". The widths are a radio group named "Viewport";
the tabs a tab list named "Pages", whose close buttons are for the pointer only – Delete closes a tab from the
keyboard. The console button reads its counts, such as "2 errors, 1 warning". The iframe is titled by the tab or the
heading. The page area is `aria-busy` while loading, and a load failure is an alert.

With `html`, the problems list is a section named by its count ("2 problems"), and each line in it reads its message and
line number. The first problem of each run is announced politely ("Error in the preview: sum is not defined"); the rest
are not, so a page that logs in a loop doesn't flood the announcements. "Sent to fix" is announced after Ask to fix.

## Content

- Give each tab a short `title` people would say: "Freezers", "Samples".
- Set `error` to what went wrong and what to do next: "The dev server stopped answering. Restart it, then retry."
- Keep `src` on the app's own dev server; only http, https and about:blank are loaded.
- Give `html` a whole document or a fragment. A fragment is wrapped in a document, and line numbers in the problems
  list count from the markup as you passed it.

## Do

- Listen for `tc-navigate`, `tc-back`, `tc-forward` and `tc-reload` and drive the page, then pass `loading`,
  `canGoBack` and `canGoForward`.
- Pass a narrower `sandbox` when the page doesn't need scripts or forms.
- Prevent `tc-close` and update `tabs` yourself when the page owns the list.
- With `html`, send `tc-fix-request`'s `errors` back to the model with the markup, then set the corrected `html`.

## Don't

- Don't load pages you don't trust with `allow-same-origin` and `allow-scripts` together: the page could reach out of
  the sandbox.
- Don't rely on the frame to report errors from another origin; the browser hides them, so the page sets `error`.
- Don't set `allowNetwork` for markup you haven't read: it lets the model's code call any server, including your own
  APIs with whatever cookies the browser sends.
- Don't treat the problems list as proof the page works; it only catches what throws or logs an error.

## Security

`html` is run so that code a model wrote can't do more than draw in its frame:

- **An opaque origin.** The iframe gets `srcdoc` with `sandbox="allow-scripts"` and never `allow-same-origin`. Its
  scripts run, but it can't read this page's DOM, cookies or storage, open pop-ups, submit forms to other sites or
  navigate the top window. `sandbox` applies to `src` only.
- **No network by default.** A `Content-Security-Policy` meta is put first in the document's head: inline scripts and
  styles run, and `data:` and `blob:` images, fonts and media load, but `connect-src`, `frame-src` and `form-action`
  are `'none'` and nothing is fetched from a server. `allowNetwork` swaps it for a policy that allows any source. A
  policy the markup adds itself can only narrow this one.
- **Reports are checked.** A short script, run before the markup's own, reports `console.error`, `console.warn`,
  uncaught errors and unhandled rejections with `postMessage`. The pane only accepts messages whose `source` is its own
  frame's window, and keeps the last 50, each message cut at 500 characters. Safari keeps an uncaught error's message
  and line from a sandbox like this one, so there the problem reads "An error was thrown – this browser hides its message
  inside the sandbox"; `console.error` and unhandled rejections still come through in full.
- **Reload runs it again.** In `html` mode Reload makes a fresh frame, and the problems start over.

## Example

```html
<tc-preview-frame id="preview" src="http://localhost:5173/" viewport="phone"></tc-preview-frame>

<script type="module">
  import "@adamstavely/trenchcoat/preview-frame";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#preview");
  el.consoleCount = { errors: 0, warnings: 2 };
  el.addEventListener("tc-reload", () => {
    el.src = "";
    requestAnimationFrame(() => (el.src = "http://localhost:5173/"));
  });
  el.addEventListener("tc-open-external", (e) => window.open(e.detail.url, "_blank", "noopener"));
</script>
```

```tsx
import { PreviewFrame } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Preview({ running, onStart }: { running: boolean; onStart: () => void }) {
  return (
    <PreviewFrame
      src={running ? "http://localhost:5173/" : ""}
      startable
      defaultViewport="tablet"
      onTcStart={onStart}
      onTcOpenExternal={(e) => window.open(e.detail.url, "_blank", "noopener")}
    />
  );
}
```

Model-written HTML, with its problems sent back to be fixed:

```html
<tc-preview-frame id="generated" heading="Generated card"></tc-preview-frame>

<script type="module">
  import "@adamstavely/trenchcoat/preview-frame";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#generated");
  el.html = `<p id="out"></p><script>document.getElementById("out").textContent = total([1, 2]);<\/script>`;
  el.addEventListener("tc-fix-request", (e) => console.log("Send back to the model:", e.detail.errors));
</script>
```

Navigation entered in the address field is retained per tab. Switching or closing a tab displays its own page; updating a tab's URL or explicitly setting `src`/`url` replaces local navigation with the application's supplied value.
