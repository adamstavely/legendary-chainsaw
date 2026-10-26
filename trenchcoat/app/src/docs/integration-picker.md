---
pattern: combobox
status: stable
related: command-menu, integration-settings, combobox
---

## Overview

The integrations page of a command menu: a search field on top, the services grouped into Connected and Available
on the left, and the picked one on the right – your app and the service on two linked tiles, what the integration
does, up to three things it adds, and a switch that connects or disconnects it. People find a service by typing,
move through the list with the arrow keys and connect it with ↵, without leaving the keyboard. The real connect can
be asynchronous: return a promise from `onToggle` and the switch shows that it's working, then flips – or says it
couldn't, and stays as it was.

## When to use

- A page inside a command menu or settings dialog where people browse and connect third-party services.
- A catalogue of up to a few dozen integrations, where one line per service and a details pane are enough to
  decide.
- Flows that should work from the keyboard end to end – search, move, connect.

## When not to use

- Running commands or jumping somewhere across the whole product – use `command-menu`, and open this picker as one
  of its pages.
- Configuring one connected service – its key, address and options – use `integration-settings`.
- Picking services as values in a form field – use `combobox`.

## Anatomy

1. **Search** `.ui-ip__search` – filters by name, domain and category; ⌘/ jumps here
2. **List** `.ui-ip__list` – the services under Connected and Available, the picked one highlighted
3. **Service** `.ui-ip__item` – a logo tile, the name and the category
4. **Tiles** `.ui-ip__art` – your app and the picked service, linked
5. **Switch** `.ui-ip__switch` – connects or disconnects the picked service
6. **Capabilities** `.ui-ip__features` – up to three things the integration adds

## Looks

Standard sets a white card in a gray tray, with “Integrations”, a back arrow and the “2 of 9 connected” count on
the tray above it. Clean has no tray: one white card with hairline shadows, the crumb and search in its top row,
and a last row with the connected count and the ↑ ↓ ↵ key hints.

## Keyboard

Focus stays in the search field; the arrow keys move the highlight through the list.

| Key | What it does |
|---|---|
| ↓ / ↑ | Picks the next or previous service (wraps at the ends) |
| Enter | Connects or disconnects the picked service |
| Escape | Clears the search; with an empty search, fires `tc-close` |
| ← | In an empty search, goes back (fires `tc-back`, only with `back`) |
| ⌘/ or Ctrl+/ | From anywhere on the page, moves focus into the search (change it with `hotkey`, or `false` for none) |
| Tab | Moves on to the switch and “Explore integration” |

## Screen readers

The search field is a `combobox` named “Search integrations” that controls a `listbox` named “Integrations”;
`aria-activedescendant` points at the picked option, so focus never leaves the field. Options sit in groups named
“Connected” and “Available”, and the picked one is `aria-selected`. The details are a section named “Linear
details”, and the switch is a `switch` named “Connect Linear” with `aria-checked`. A polite status confirms each
change – “Linear connected” or “Linear disconnected”, after “Connecting Linear…” while an `onToggle` promise is
pending; a failure is an alert: “Couldn't connect Linear – try again”. With no matches, the list says “No integrations match “…””.

## Content

- Write each `description` as what the integration does for people, in one sentence: “Turn requests from chat into
  issues and keep their status in sync both ways.”
- Keep `features` to three short capabilities, without full stops.
- Use a familiar `category` – “Project management”, “Payments” – since search matches it too.
- Set `appName` to your product's name; the details read “Your app + Linear”.

## Do

- Return a promise from `onToggle` that resolves when the service is really connected, so the switch tells the
  truth.
- Pass `back` (or `onBack` in React) when the picker is a page inside a command menu, so ← and the arrow lead out.
- Supply a mark for each service – an SVG `path` with `color` and `tile`, or an `icon`.

## Don't

- Don't use it for long settings forms – link “Explore integration” to `integration-settings` instead.
- Don't reorder the list while people switch services on and off – the groups are taken when the list is shown or
  searched, and that's deliberate.
- Don't leave `hotkey` on ⌘/ if your app already uses that shortcut.

## Example

```html
<tc-integration-picker id="picker" app-name="Acme" back></tc-integration-picker>

<script type="module">
  import "trenchcoat/integration-picker";
  import "trenchcoat/tokens.css";

  const picker = document.querySelector("#picker");
  picker.integrations = [
    { id: "linear", name: "Linear", domain: "linear.app", category: "Project management", description: "Turn requests into issues.", connected: true },
    { id: "stripe", name: "Stripe", domain: "stripe.com", category: "Payments", description: "See invoices next to every conversation." },
  ];
  picker.onToggle = (id, connected, { signal }) =>
    fetch(`/api/integrations/${id}`, { method: connected ? "POST" : "DELETE", signal });
  picker.addEventListener("tc-back", () => history.back());
</script>
```

```tsx
import { IntegrationPicker, defaultIntegrations } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Integrations({ onBack }: { onBack: () => void }) {
  return (
    <IntegrationPicker
      integrations={defaultIntegrations}
      appName="Acme"
      onToggle={(id, connected, { signal }) => fetch(`/api/integrations/${id}`, { method: connected ? "POST" : "DELETE", signal })}
      onExplore={(id) => console.log("Open settings for", id)}
      onBack={onBack}
    />
  );
}
```
