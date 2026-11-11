---
pattern: none
status: new
related: attention-pulse, status-morph, number-field, stepper-form
---

## Overview

Wraps a field or a short form and shakes it once when it turns invalid. The content does a short, damped shake from side to side, the field's outline pulses in the error colour and stays, and the message slides in below and is announced. Change `shake-key` to shake again on a second wrong submit. It never shakes on first render, so a field that loads invalid just shows the outline and the message. With reduced motion nothing moves: the outline and the message appear in place.

## When to use

- A submit that failed on one field: a case number in the wrong format, a code that didn't match.
- A wrong answer the person should notice straight away, such as a one-time code.

## When not to use

- Errors found while typing – show the message without shaking, or it shakes on every key.
- Several fields wrong at once – list them in a summary above the form instead.
- A problem that isn't the person's input, such as a failed save – use a notice like [Guardrail Notice](#/guardrail-notice).

## Anatomy

1. **Host** `[data-ui="esk"]` – wraps the content; its direct children shake
2. **Message** `.ui-esk__message` – the error, with an icon, announced as an alert
3. **Icon** `.ui-esk__icon` – a circle with an exclamation mark

## Looks

No look of its own. A page can set `--tc-error-shake-color` (the outline), `--tc-error-shake-text` (the message), `--tc-error-shake-distance` (how far it moves) and `--tc-error-shake-ring` (the pulse's reach).

## Keyboard

Nothing to operate: the fields inside keep their own keys.

## Screen readers

The message is the only alert, so it's read once when it appears. While invalid, native inputs, textareas and selects inside get `aria-invalid="true"` and point at the message with `aria-describedby`; both are taken back when the field is valid again. The shake itself says nothing.

## Content

- Say what's wanted, not just that it's wrong: "Enter a case number like FR-2041".
- Keep it to one line.

## Do

- Put focus back in the field after a failed submit, so the person can fix it.

## Don't

- Don't shake on a timer or while typing.
- Don't rely on the shake alone – the message carries the meaning.

## Example

```html
<tc-error-shake invalid message="Enter a case number like FR-2041">
  <label>Case number <input name="case" value="FR 2041" /></label>
</tc-error-shake>

<script type="module">
  import "@adamstavely/trenchcoat/error-shake";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

```tsx
import { useState } from "react";
import { ErrorShake } from "@adamstavely/trenchcoat/react";

export function CaseNumber() {
  const [value, setValue] = useState("");
  const [tries, setTries] = useState(0);
  const invalid = tries > 0 && !/^FR-\d{4}$/.test(value);
  return (
    <form onSubmit={(e) => { e.preventDefault(); setTries(tries + 1); }}>
      <ErrorShake invalid={invalid} shakeKey={tries} message="Enter a case number like FR-2041">
        <label>Case number <input value={value} onChange={(e) => setValue(e.target.value)} /></label>
      </ErrorShake>
      <button type="submit">Open case</button>
    </form>
  );
}
```
