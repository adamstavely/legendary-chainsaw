---
pattern: switch
status: stable
related: integration-picker, combobox, stepper-form
---

## Overview

The settings card for one connected service. Its header shows the service's logo, name and status, with a switch
that pauses or resumes the sync straight away. Below it are the service's settings: an API key people generate,
reveal and copy, the site address with validation as they type, and a searchable time zone picker. Edits collect in
a save bar – “Unsaved changes”, with Discard and Save – so nothing is half-saved. Generating, switching and saving
can all be asynchronous; failures say so in place and keep what people entered.

## When to use

- The page or panel people reach after connecting a service, to configure it.
- Services whose setup is a key, an address and a few options, saved together.
- Pausing a sync without disconnecting it – the switch keeps the settings.

## When not to use

- Browsing and connecting services in the first place – use `integration-picker`.
- Choosing from a long list of values in a form field of your own – use `combobox`.
- A first-time setup that walks through several steps in order – use `stepper-form`.

## Anatomy

1. **Header** `.tc-head` – the service's logo in the icon box, its name and status line, and the count and switch at the right
2. **Switch** `.ui-is__switch` – pauses or resumes the sync, and saves at once
3. **API key** `.ui-is__generate` – generates a key; then the key with Show, Copy and Regenerate
4. **Site address** `.ui-is__field` – the domain after a fixed https://, checked as it's typed
5. **Time zone** `.ui-is__zone-btn` – opens a searchable list of zones

The save bar slides in under the settings once something has changed.

## Looks

Standard sets the settings in a white card under the header on the gray tray, with a spinner while a key is
generated. Clean is one white card: the header with the switch on top, the settings in hairline-separated sections
with their labels, finer icons, a magnifier in the time zone search, and “Generating…” shimmering instead of a
spinner. In both, switching off folds the settings away.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the switch, the key buttons, the address, the time zone and the save bar |
| Enter / Space | Presses the focused button, or flips the switch |
| ↓ / ↑ | On the time zone button, opens the list; in its search, moves through the zones |
| Ctrl+Home / Ctrl+End | In the time zone search, moves to the first or last zone |
| Enter | In the time zone search, picks the active zone and closes the list |
| Escape | In the time zone search, closes the list and returns focus to the button |

Focus never drops to the page: Generate and Regenerate hand focus to each other, and a closing save bar hands it to
the address field.

## Screen readers

The card is a `region` named “Shopify settings”. The switch is a `switch` named “Shopify sync” with `aria-checked`,
and `aria-busy` while an `onToggle` promise runs. The address field is labelled “Site address”, described by its
hint, and `aria-invalid` once it's left with something that isn't a domain; the hint is a polite live region that
then says “That doesn't look like a domain – try something like yourstore.com”. The time zone button has
`aria-haspopup="listbox"`; its search is a `combobox` named “Search time zones” over a listbox of options. A polite
status confirms actions – “New key generated. Copy it now – it is shown in full only once.”, “Key copied to the
clipboard.”, “Changes saved.”, “Changes discarded.” – and failures are alerts, such as “Couldn't save – try again.”

## Content

- Use `meta` for what the connection is doing: “Connected Mar 14 · syncing orders every 5 min”. Paused, it reads
  “Paused – no data is synced”.
- Set `siteHint` for your service – the default, “Your store's primary domain, without https://”, is written for a
  shop.
- Use `count` for one number people care about, such as synced orders – not a status.
- List time zones as “(GMT +01:00) Berlin” so search works by city and by offset.

## Do

- Pass `onGenerateKey` (or `generateKey`) that creates a real key – without it, a `sk_demo_…` key is made up and a
  warning is logged.
- Return promises from `onSave` and `onToggle`, so failures show and nothing flips that didn't happen.
- Load saved values into `defaultValues` when they arrive – fields people haven't edited follow them.

## Don't

- Don't pass a stored secret key into `values.apiKey` unless people may see it – the card masks it, but Show
  reveals the whole key.
- Don't put unrelated account settings in this card; it's for one service.
- Don't set `demo` outside galleries and prototypes.

## Example

```html
<tc-integration-settings id="shopify" name="Shopify" meta="Connected Mar 14 · syncing orders every 5 min"></tc-integration-settings>

<script type="module">
  import "trenchcoat/integration-settings";
  import "trenchcoat/tokens.css";

  const card = document.querySelector("#shopify");
  card.values = { enabled: true, siteUrl: "northwind-goods.com", timeZone: "(GMT −05:00) New York", apiKey: null };
  card.generateKey = ({ signal }) => fetch("/api/keys", { method: "POST", signal }).then((r) => r.text());
  card.saveValues = (values, { signal }) => fetch("/api/shopify", { method: "PUT", body: JSON.stringify(values), signal }).then(() => {});
  card.addEventListener("tc-values-change", (e) => console.log("Saved", e.detail.values));
</script>
```

```tsx
import { IntegrationSettings, type IntegrationValues } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function ShopifySettings({ saved }: { saved: IntegrationValues }) {
  return (
    <IntegrationSettings
      name="Shopify"
      logo={<img src="/logos/shopify.svg" alt="" width={24} height={24} />}
      meta="Connected Mar 14 · syncing orders every 5 min"
      defaultValues={saved}
      onGenerateKey={({ signal }) => fetch("/api/keys", { method: "POST", signal }).then((r) => r.text())}
      onSave={async (values, { signal }) => {
        await fetch("/api/shopify", { method: "PUT", body: JSON.stringify(values), signal });
      }}
    />
  );
}
```
