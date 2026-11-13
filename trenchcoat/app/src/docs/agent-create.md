---
pattern: form
status: new
related: agent-list, instruction-editor, tool-permissions, trigger-builder
---

## Overview

Describe an agent in a sentence or two and get a working draft. Generate asks the page's model, which streams the draft back: a name, instructions, the tools it should use, a model and what starts it, with any questions the model has. Every section is editable before Create.

## When to use

- The first step of making an agent, for people who know the job but not how to set up an agent.
- Turning a request ("check expense claims against the policy") into a draft someone then reviews.

## When not to use

- Editing a finished agent's instructions in depth – use `instruction-editor`.
- Fine-grained tool rules per agent – use `tool-permissions`.
- Building one trigger with conditions and a schedule – use `trigger-builder`.

## Anatomy

1. **Describe** `.ui-agcr__describe` – the `.ui-agcr__prompt` field, example `.ui-agcr__chip`s and `.ui-agcr__generate`
2. **Draft** `.ui-agcr__draft` – `.ui-agcr__name`, `.ui-agcr__instructions`, the `.ui-agcr__switch` per tool, `.ui-agcr__model` and the `.ui-agcr__trigger`s
3. **Questions** `.ui-agcr__questions` – each `.ui-agcr__question` with its `.ui-agcr__answer`
4. **Actions** `.ui-agcr__actions` – `.ui-agcr__start-over` and `.ui-agcr__create`

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. A page can set `--tc-agcr-track-w` and `--tc-agcr-track-h`, the tool switches' size.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Through the field, the examples, Generate, then each part of the draft |
| Ctrl / ⌘ + Enter | In the description: Generate |
| Enter / Space | On a tool: switch it on or off |
| Enter | In "Add a trigger": add it |

## Screen readers

Every field has a visible label; the tools are switches (`role="switch"`) with their description linked. While the draft streams in, its section is `aria-busy`. "Writing the draft…" and "Draft ready" are announced once each in a polite status. Generate and Create stay focusable when they can't act yet (`aria-disabled`), with the reason as their description; pressing them moves focus to the field to fix and says what's missing.

## Content

- Examples are whole requests a person might type, not keywords.
- The draft's `questions` are what the model couldn't decide on its own; keep them few and answerable in a line.
- Tool labels and descriptions are the page's words for what the agent may do.

## Do

- Set `streaming` while the draft arrives and clear it when it's done, so Create waits for a whole draft.
- Send the answers to the questions back to the model with the next Generate.

## Don't

- Don't switch on every tool the model suggests – leave risky ones (email, payments) off until someone turns them on.

## Example

```html
<tc-agent-create id="new-agent"></tc-agent-create>

<script type="module">
  import "@adamstavely/trenchcoat/agent-create";
  import "@adamstavely/trenchcoat/tokens.css";

  const form = document.querySelector("#new-agent");
  form.examples = ["Match supplier invoices to purchase orders", "Answer staff questions from the policy library"];
  form.addEventListener("tc-generate", (e) => {
    e.preventDefault(); // the draft is ready at once here, so it doesn't stream
    form.draft = {
      name: "Invoice matcher",
      instructions: "Match each new invoice to its purchase order: " + e.detail.description,
      tools: [{ id: "ledger", label: "Ledger search", enabled: true }],
      model: "Model M",
      triggers: [{ id: "t1", label: "A new invoice arrives" }],
      questions: [{ id: "q1", question: "What should it do with invoices that have no order?" }],
    };
  });
  form.addEventListener("tc-create", (e) => console.log("Create", e.detail.draft));
</script>
```

```tsx
import { useState } from "react";
import { AgentCreate, type AgentDraft } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function NewAgent({ ask, create }: { ask: (description: string) => Promise<AgentDraft>; create: (draft: AgentDraft) => void }) {
  const [draft, setDraft] = useState<AgentDraft | null>(null);
  const [streaming, setStreaming] = useState(false);
  return (
    <AgentCreate
      examples={["Match supplier invoices to purchase orders"]}
      draft={draft}
      onDraftChange={setDraft}
      streaming={streaming}
      onGenerate={(description) => {
        setStreaming(true);
        ask(description).then((d) => {
          setDraft(d);
          setStreaming(false);
        });
        return false;
      }}
      onCreate={create}
    />
  );
}
```
