---
pattern: form
status: new
related: model-picker, model-routing, tool-permissions, data-handling-policy
---

## Overview

The admin page for which models a workspace may use. Models are grouped by provider, and each shows what it can do
(vision, tools, long context), a price tier and where its data is kept. Each has a switch that allows or blocks it and a
Require approval checkbox for models people may use only with an admin's sign-off. Below the list, the default model is
picked from the allowed ones, and a rule decides what happens to models a provider adds later – blocked until an admin
allows them, or allowed straight away. When a blocked model is still used by agents, it says so in words: "Policy Q&A
uses large-1 – blocking it will stop that agent". The footer says who changed the policy last.

## When to use

- A workspace or organisation settings page where admins decide which models people and agents may use.
- Keeping costly or out-of-region models off by default, with new ones blocked until reviewed.
- Showing the effect of blocking a model on the agents that depend on it, before anyone saves.

## When not to use

- Picking a model for one chat or one request – use `model-picker`.
- Deciding which model a request goes to, with fallbacks and health – use `model-routing`.
- Deciding what each agent may do with its tools – use `tool-permissions`.
- Retention, logging and training rules for the data itself – use `data-handling-policy`.

## Anatomy

1. **Provider** `.ui-mac__provider` – the group heading
2. **Model** `.ui-mac__model` – a row: name, New, description, capabilities, price tier and residency
3. **Warning** `.ui-mac__warn` – the agents that stop if the model stays blocked
4. **Require approval** `.ui-mac__approval` – a checkbox, off while the model is blocked
5. **Switch** `.ui-mac__switch` – allowed or blocked, with the word beside it
6. **Policy** `.ui-mac__policy` – the default model and the rule for new models
7. **Footer** `.ui-mac__footer` – who changed the policy last, and when

## Looks

Standard is a white card on a gray tray with the header on the tray. Clean is one white card with the header as its first
row. The policy sits on a quiet band at the bottom of the card in both.

## Keyboard

Every control is a native button, checkbox or select, in reading order.

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves between switches, checkboxes, the default model and the rule |
| Space / Enter | Flips the focused switch; Space ticks the focused checkbox |
| ↑ / ↓ | In the default model, picks the previous or next allowed model |

## Screen readers

Each provider is a section named by its heading, and its models are a list. A model's switch is a `switch` named
"large-1 allowed" and read as on or off; when blocking it would stop agents, the warning is its description. Require
approval is a checkbox named "Require approval for large-1", disabled while the model is blocked. The price tier is read in
words ("High cost"). The default model is a labelled select, marked invalid with a description when the current default
is blocked. Every change is confirmed in a polite status message: "large-1 blocked. Policy Q&A uses large-1 – blocking it
will stop that agent".

## Content

- Use the provider's or your gateway's model names, as people will see them elsewhere in the product.
- Keep `description` to one short phrase about what the model is good at.
- Give `residency` as regions people recognise: "EU", "US", "UK".
- Fill in `usedBy` from your agents' settings, so the warning is accurate.

## Do

- Handle `tc-access-change` and store the policy; call `preventDefault()` when the change isn't allowed (a model a
  contract requires).
- Set `changedBy` from your audit trail.
- Mark models that arrived since the last review `isNew`, so admins can see what's waiting.

## Don't

- Don't let the default model be a blocked one – the select asks for another, and your server should refuse it too.
- Don't use the switch as an on/off for one person's chats; this is the workspace's policy.
- Don't hide blocked models – admins need to see them to allow them again.

## Example

```html
<tc-model-access id="access" description="Which models this workspace may use."></tc-model-access>

<script type="module">
  import "@adamstavely/trenchcoat/model-access";
  import "@adamstavely/trenchcoat/tokens.css";

  const access = document.querySelector("#access");
  access.models = [
    { id: "large-1", name: "large-1", provider: "Provider A", capabilities: ["tools", "long-context"], tier: "high", residency: "EU", usedBy: ["Policy Q&A"] },
    { id: "small-2", name: "small-2", provider: "Provider A", capabilities: ["tools"], tier: "low", residency: "EU" },
    { id: "vision-1", name: "vision-1", provider: "Provider B", capabilities: ["vision"], tier: "medium", residency: "US", isNew: true },
  ];
  access.access = { models: { "large-1": { allowed: true }, "small-2": { allowed: true } }, defaultModel: "small-2", blockNew: true };
  access.addEventListener("tc-access-change", (e) => console.log(e.detail.change));
</script>
```

```tsx
import { useState } from "react";
import { ModelAccess, type ModelAccessModel, type ModelAccessValue } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const models: ModelAccessModel[] = [
  { id: "large-1", name: "large-1", provider: "Provider A", capabilities: ["tools", "long-context"], tier: "high", usedBy: ["Policy Q&A"] },
  { id: "small-2", name: "small-2", provider: "Provider A", capabilities: ["tools"], tier: "low" },
];

export function WorkspaceModels() {
  const [access, setAccess] = useState<ModelAccessValue>({ models: {}, defaultModel: "small-2" });
  return <ModelAccess title="Model access" models={models} access={access} onAccessChange={setAccess} changedBy={{ name: "Priya Shah" }} />;
}
```
