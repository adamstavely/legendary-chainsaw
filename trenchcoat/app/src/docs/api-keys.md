---
pattern: list
status: new
related: webhooks, share-link-manager, integration-settings, role-editor
---

## Overview

The API keys of a workspace or an account, for the people who connect other apps to it. Each key shows its name, its masked value ("tc_live_…a91f"), its permissions as chips, who made it and when, when it was last used ("Never used" when it hasn't been), and where it stands – Active, Expires in 5 days, Expired or Revoked – in words as well as colour.

Create key opens a form in place: a name, the permissions (`scopes`) and how long the key lasts (`expiryOptions`: 30 days, 90 days, 1 year or Never by default). Submitting fires `tc-key-create`; the page makes the key on its server and sets `revealed` to `{ id, secret }`. The secret shows once, in a highlighted panel with Copy and "Copy it now – you won't be able to see this key again". Done fires `tc-reveal-dismiss` and the secret is gone from the page.

Revoke asks in place – "Apps using it stop working at once" – and fires `tc-key-revoke` with the keys as they'd be. Revoked and expired keys fold away under "Inactive keys (n)". Keys that expire within `warn-days` (14 by default) say how many days are left, in warning colours.

The element only shows and asks. The server makes, stores and checks keys; the full secret never reaches the element except in `revealed`.

## When to use

- A settings page where developers make and revoke keys for your API.
- An admin review of which keys exist, who made them and which are stale.

## When not to use

- Links that share a document – use `share-link-manager`.
- One secret a person types in, such as a model provider's key – use `secret-field` or `integration-settings`.
- Where events are sent – use `webhooks`.

## Anatomy

1. **Header** `.tc-head` – the title, and Create key `.ui-akm__create`
2. **New key** `.ui-akm__reveal` – the secret `.ui-akm__secret`, the warning `.ui-akm__reveal-note`, `.ui-akm__copy` and `.ui-akm__done`
3. **Form** `.ui-akm__form` – the name `.ui-akm__name-input`, permissions `.ui-akm__check`, expiry `.ui-akm__radio`, `.ui-akm__submit`
4. **Key** `.ui-akm__row` – `.ui-akm__name`, `.ui-akm__masked`, `.ui-akm__status`, `.ui-akm__scopes`, `.ui-akm__facts` and `.ui-akm__revoke`
5. **Confirm** `.ui-akm__confirm` – Keep and Revoke, in place
6. **Inactive keys** `.ui-akm__inactive-toggle` – the folded list of revoked and expired keys

## Looks

Standard sets the header on a gray tray above a white card; Clean is one white card with the header as its first row. Status uses the status colours with a dot and a word. The new key's panel uses the warning colours, so it stands out until Done.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Move through Create key, the keys' Revoke buttons and Inactive keys |
| Enter / Space | Press the button with focus; Enter in the form creates the key |
| Escape | Close the Create key form |

## Screen readers

The keys are a list labelled by the heading. Each masked value is read as "Key starting tc_live_…a91f". Status is a word, not only a colour. Revoke buttons are named with the key ("Revoke, Case intake bot"), and the question in place is a group named the same way, with focus moved to Keep. The form's name field says when it's missing, and Inactive keys says whether it's open. Copying and revoking are announced in a polite status line.

## Content

- Name keys for what uses them: "Case intake bot", not "Key 3".
- Give scopes short ids and a sentence each: "cases:write – Open, update and close cases".
- Default to an expiry; offer Never only where your security policy allows it.

## Do

- Show `revealed` only right after creating the key, and clear it on `tc-reveal-dismiss`.
- Keep `last4` and `prefix` short enough to recognise a key, never enough to use it.
- Record who made each key (`createdBy`), so stale keys have an owner.

## Don't

- Don't put the full secret in `keys` – only `revealed` holds it, once.
- Don't revoke without the in-place question: apps using the key stop at once.

## Example

```html
<tc-api-keys id="keys" description="Ledgerline · Fraud review workspace"></tc-api-keys>

<script type="module">
  import "@adamstavely/trenchcoat/api-keys";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#keys");
  el.scopes = [
    { id: "cases:read", label: "cases:read", description: "Read cases and their history" },
    { id: "cases:write", label: "cases:write", description: "Open, update and close cases" },
  ];
  el.keys = [{ id: "k1", name: "Case intake bot", prefix: "tc_live_", last4: "07c2", createdAt: Date.now() - 86_400_000, scopes: ["cases:read"] }];
  el.addEventListener("tc-key-create", async (e) => {
    const { key, secret } = await fetch("/api/keys", { method: "POST", body: JSON.stringify(e.detail) }).then((r) => r.json());
    el.keys = [key, ...el.keys];
    el.revealed = { id: key.id, secret };
  });
  el.addEventListener("tc-key-revoke", (e) => fetch(`/api/keys/${e.detail.id}`, { method: "DELETE" }));
</script>
```

```tsx
import { useState } from "react";
import { ApiKeys, type ApiKey, type ApiKeyReveal } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function KeysSettings({ initial, createKey }: { initial: ApiKey[]; createKey: (name: string, scopes: string[], days: number | null) => Promise<{ key: ApiKey; secret: string }> }) {
  const [keys, setKeys] = useState(initial);
  const [revealed, setRevealed] = useState<ApiKeyReveal | null>(null);
  return (
    <ApiKeys
      keys={keys}
      onKeysChange={setKeys}
      scopes={[{ id: "cases:read", label: "cases:read" }]}
      revealed={revealed}
      onRevealDismiss={() => setRevealed(null)}
      onKeyCreate={async ({ name, scopes, expiresIn }) => {
        const { key, secret } = await createKey(name, scopes, expiresIn);
        setKeys((all) => [key, ...all]);
        setRevealed({ id: key.id, secret });
      }}
    />
  );
}
```
