---
pattern: list
status: new
related: secret-field, integration-settings, trigger-list, mcp-connection-manager
---

## Overview

The secrets agents run on – API keys, tokens and passwords – by name and scope. Secrets an agent needs that aren't set come first, under Missing, with the agents that need them; then the saved ones, expired and expiring first, each with when and by whom it was last updated and which agents use it. Values are write-only: Set value or Replace opens a password field, Save hands the value to the page and the element forgets it. Delete asks first and names the agents that will stop working. Add secret takes a new name in UPPER_SNAKE_CASE, a scope and a value.

## When to use

- The secrets page of an agent platform or a workspace's settings.
- Showing what an agent is missing before it can run, with the fix in place.

## When not to use

- One secret in a settings form – use `secret-field`.
- Connecting a service with an API key and its other settings – use `integration-settings`.
- Links that share a file – use `share-link-manager`.

## Anatomy

1. **Groups** `.ui-sec__group` – Missing, then Saved, each with `.ui-sec__group-title` and a count
2. **Row** `.ui-sec__row` – one secret: `.ui-sec__name` and `.ui-sec__scope`
3. **Status** `.ui-sec__status` – a mark and a word: Set, Missing, Expiring soon, Expired
4. **Facts** `.ui-sec__facts` – updated when and by whom, expiry, and `.ui-sec__needed` – which agents use or need it
5. **Actions** `.ui-sec__actions` – `.ui-sec__edit` (Set value or Replace) and `.ui-sec__delete`
6. **Value form** `.ui-sec__form` – a `tc-secret-field` (`.ui-sec__value`), `.ui-sec__cancel` and `.ui-sec__save`
7. **Question** `.ui-sec__confirm` – names the agents that will stop working, with `.ui-sec__keep` and `.ui-sec__confirm-delete`
8. **New secret** `.ui-sec__new` – opened by `.ui-sec__add` with `creatable`: `.ui-sec__new-name`, `.ui-sec__new-scope` and a value

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. Set value on a missing secret, Save and Add are primary buttons. `--tc-sec-ring` sets the width of the hollow and half-filled status marks.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through each secret's actions, and the open form's fields |
| Enter / Space | Presses a button |
| Enter | In a value field: saves |
| Escape | In a value field or the new-secret form: closes it, returning focus to the button that opened it |

Set value and Replace move focus into the value field; Delete moves it to Keep. After a delete, focus goes to the next secret's name.

## Screen readers

Missing and Saved are headings over lists. Status is a word as well as a mark; the marks differ in shape (filled, hollow, half-filled, square), not only colour. Each button's name includes the secret it acts on – "Replace, MODEL_API_KEY". The value field is named "Value of MODEL_API_KEY" and its Show button is a toggle. The new name is described by its hint and, once wrong, by its error, with `aria-invalid`. `role="status"` announces saves, additions and deletions – never a value.

## Content

- Name secrets in UPPER_SNAKE_CASE for what they unlock: `LEDGER_API_TOKEN`, not `KEY2`.
- Give `usedBy` for every secret, missing ones included, so people know what breaks and what's waiting.
- Use the agent's name for an agent's own secret's `scope`, and "Workspace" for shared ones.

## Do

- Store the value on the server in `tc-secret-set` and never send it back; the element only ever needs the status.
- Mark a secret `missing` when an agent needs it and it isn't set, so it comes first.
- Pass `now` and `currentUser` so a fresh update shows its date and who made it.

## Don't

- Don't put a value, or part of one, in `name` or the labels – the element can't hide what it's given as text.
- Don't keep the value in page state after `tc-secret-set`; the element has already forgotten it.

## Example

```html
<tc-secrets-manager id="secrets" creatable></tc-secrets-manager>

<script type="module">
  import "@adamstavely/trenchcoat/secrets-manager";
  import "@adamstavely/trenchcoat/tokens.css";

  const manager = document.querySelector("#secrets");
  manager.scopes = ["Workspace", "Invoice matcher"];
  manager.secrets = [
    { name: "LEDGER_API_TOKEN", scope: "Invoice matcher", status: "missing", usedBy: ["Invoice matcher"] },
    { name: "MODEL_API_KEY", scope: "Workspace", status: "set", usedBy: ["Invoice matcher", "Vendor risk"] },
  ];
  manager.addEventListener("tc-secret-set", (e) => console.log("store", e.detail.name));
</script>
```

```tsx
import { SecretsManager, type Secret } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const secrets: Secret[] = [
  { name: "LEDGER_API_TOKEN", scope: "Invoice matcher", status: "missing", usedBy: ["Invoice matcher"] },
  { name: "MODEL_API_KEY", scope: "Workspace", status: "set", usedBy: ["Invoice matcher"] },
];

export function Secrets({ save }: { save: (name: string, value: string) => void }) {
  return <SecretsManager defaultSecrets={secrets} creatable onSecretSet={({ name, value }) => save(name, value)} />;
}
```
