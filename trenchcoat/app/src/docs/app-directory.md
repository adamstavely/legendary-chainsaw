---
pattern: menu
status: new
related: integration-picker, integration-settings, provider-connection, mcp-connection-manager
---

## Overview

A directory of integrations to browse, search and connect. Categories run down the left with a count each, and the
apps sit in a grid of cards on the right: a logo tile, the name with a verified seal, who builds it, two lines of
description and a Connect button. A search field filters by name, vendor and description, and a filter menu narrows
to connected or not-connected apps. Connecting shows a short "Connecting…" state – or waits for the promise your
`onToggle` returns, such as an OAuth round trip, and leaves the app as it was with the error when it rejects. A
connected app's button reads "Connected" and shows "Disconnect" on hover and focus. Essentials ends with a "Discover
more" card that opens all apps.

## When to use

- The settings page where a workspace connects the tools it already uses.
- A marketplace of add-ons, plugins or data sources with a connect or install step.
- Onboarding, to suggest the first few integrations worth connecting.

## When not to use

- Picking one integration inside a flow, such as a source for an import – use `integration-picker`.
- Configuring one connected integration – use `integration-settings`.
- Showing the state of one provider's connection – use `provider-connection`.
- Managing MCP servers and their tools – use `mcp-connection-manager`.

## Anatomy

1. **Bar** `.ui-adir__bar` – "Apps" and how many are connected, on the tray
2. **Search** `.ui-adir__search` – the search field
3. **Filter** `.ui-adir__filter-btn` – the filter menu's trigger; `.ui-adir__menu` is the menu
4. **Categories** `.ui-adir__nav` – one button per category, with its count
5. **Card** `.ui-adir__app` – an app: `.ui-adir__tile`, `.ui-adir__name`, `.ui-adir__vendor` and `.ui-adir__desc`
6. **Connect** `.ui-adir__connect` – Connect, Connecting… or Connected; `.ui-adir__error` shows a failed attempt
7. **Discover more** `.ui-adir__discover` – the last card in Essentials, with View all

## Looks

One look in both Standard and Clean, as the block it came from: a gray tray with a slim title bar holding a white
card. Clean's tokens still apply – its radii, shadows and colours. A logo tile takes the app's `tile` colour, or
stays white with a thin edge.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the search field, the filter, the categories and each card's Connect button |
| Enter / Space | Picks a category, connects or disconnects an app, opens the filter menu |
| ↓ / ↑ | In the filter menu: moves between All apps, Connected and Not connected |
| Home / End | In the filter menu: moves to the first or last option |
| Escape | Closes the filter menu and returns focus to its trigger |

When a card or the empty state goes away under focus – after a filter, Clear search or View all – focus moves to the
next card's Connect button or to the control that replaced it, never to the page.

## Screen readers

The element is a region named by the heading. Categories are a navigation landmark, and the current one is
`aria-current`. Each Connect button is named by its visible words plus the app – "Connect Notion", "Connected
Slack" – so voice control matches what's on screen. A Connecting… button is `aria-disabled`. A failed attempt is an
alert. One status region, there from the start, announces each change: "Slack connected".

## Content

- Write descriptions as what the integration does for the team, in one sentence: "Link pull requests and see deploy
  status next to every task."
- Name the vendor as the company, not a product line.
- Keep `essential` for the handful most teams want – Essentials is the first view.
- Throw from `onToggle` (or reject its promise) with a message people can act on: "Slack said no – ask an admin to
  allow the app."

## Do

- Return a promise from `onToggle` for the real authorization, so the card stays pending and failures show.
- Control `connected` from your data once connections live on the server.
- Give logos as small square SVGs; brand colours go in `tile`.

## Don't

- Don't use it for a handful of choices – a short list or `integration-picker` is quicker.
- Don't write long descriptions – the card clamps them to two lines.
- Don't rename "Connect" to marketing copy – the button's words are its name.

## Example

```html
<tc-app-directory id="apps" heading="Integrations"></tc-app-directory>

<script type="module">
  import "trenchcoat/app-directory";
  import "trenchcoat/tokens.css";

  const apps = document.querySelector("#apps");
  apps.onToggle = (app, on) => fetch(`/api/integrations/${app.id}`, { method: on ? "POST" : "DELETE" }).then((r) => {
    if (!r.ok) throw new Error(`Couldn't ${on ? "connect" : "disconnect"} ${app.name}.`);
  });
  apps.addEventListener("tc-connected-change", (e) => console.log(e.detail.connected));
</script>
```

```tsx
import { useState } from "react";
import { AppDirectory } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Integrations() {
  const [connected, setConnected] = useState<string[]>(["slack"]);
  return (
    <AppDirectory
      title="Integrations"
      connected={connected}
      onConnectedChange={setConnected}
      onToggle={(app, on) => fetch(`/api/integrations/${app.id}`, { method: on ? "POST" : "DELETE" })}
    />
  );
}
```
