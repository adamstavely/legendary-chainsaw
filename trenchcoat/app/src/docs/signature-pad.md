---
pattern: form
status: new
related: terms-dialog, data-handling-policy, otp-input, stepper-form
---

## Overview

A form field for signing. People draw their signature on a pad with a mouse, pen or finger – the ink thins as the
stroke speeds up and thickens with a pen's pressure – or type their name and see it set in a script face. Undo takes
the last stroke away and Clear empties the pad. Under the pad sit the signer's name, the date and an optional statement
of what signing means. It is a form control: it submits the signature as JSON under `name`, checks `required`, and
clears on a form reset. `toSVG()` and `toDataURL()` export what was signed.

## When to use

- Agreements, consent forms, approvals and hand-overs that need a signature in the person's own hand.
- The last step of a flow that collects an acceptance – a data-access agreement, a delivery receipt, a waiver.
- Anywhere a typed name is acceptable as a signature too, with `allow-typed`.

## When not to use

- Accepting terms with a checkbox and a button – use `terms-dialog`.
- Recording consent to a policy as settings – use `data-handling-policy`.
- Verifying who someone is – a drawn signature proves nothing on its own; use `otp-input` or your sign-in.

## Anatomy

1. **Pad** `.ui-sigp__surface` – where the ink goes; a baseline, an “×” and “Sign here” until something is drawn
2. **Ink** `.ui-sigp__ink` – the strokes, drawn from the stored value; `.ui-sigp__stroke` is one stroke
3. **Toolbar** `.ui-sigp__tools` – Undo, Clear and “Type instead” (`.ui-sigp__mode`)
4. **Typed field** `.ui-sigp__typed` – the name field that replaces the pad in typed mode
5. **Signer and date** `.ui-sigp__meta` – the `signer` line and the date
6. **Statement** `.ui-sigp__statement` – what signing means, from `statement`
7. **Error** `.ui-sigp__error` – `error-message`, while `invalid`

## Looks

Standard puts the header on the gray tray above a white card that holds the pad, the toolbar and the signer line.
Clean is one white card with the header as its first row. In both the pad is a sunken field with a dashed baseline and
the ink is the strongest text colour, so it follows light and dark themes.

Component tokens a page can override on the element: `--tc-sigp-pad-h` (the pad's height, 160 px),
`--tc-sigp-pad-min-h` (its height in narrow containers, 120 px), `--tc-sigp-line-inset` (how far the baseline sits
above the bottom) and `--tc-sigp-script-font` (the font stack for typed signatures).

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through Undo, Clear and “Type instead” – the toggle is always reachable, even when `allow-typed` hides it from pointer users |
| Enter / Space | Presses the focused button; on “Type instead” the name field appears and takes focus |
| Typing | In typed mode, the name becomes the signature as you type |
| Enter / Space on “Draw instead” | Returns to the pad; the typed signature stays until something is drawn |

Drawing needs a pointer. Typed mode is the keyboard's way to sign, which is why its toggle never leaves the tab order:
without `allow-typed` it is hidden until it has focus, like a skip link.

## Screen readers

The pad is an image named by the heading and its state: “Signature: Not signed yet”, “Signature: Signed”, or
“Signature: Signed: Noor Haddad” for a typed one. The toolbar is a `toolbar` named by the heading, and its buttons are
named by their visible words; “Type instead” is a toggle (`aria-pressed`). The typed field is labelled “Type your full
name”. The error and the statement describe the pad and the field (`aria-describedby`). A polite live region says
“Last stroke removed” after Undo and “Signature cleared” after Clear. The date is read with the word “Date”.

## Content

- Make the heading what is being signed – “Data-access agreement”, “Delivery receipt” – not just “Signature”.
- Put the full name and role in `signer`: “Noor Haddad, Research fellow”.
- Keep `statement` to one or two sentences that say what signing commits the person to, and link the full text nearby.
- Write the error as what to do: “Sign to continue.”

## Do

- Store the value (or its SVG) with the record it signs, along with who signed and when.
- Turn on `allow-typed` when a typed name is legally acceptable – it is faster on desktop and the only way for some
  people.
- Show a stored signature with `readonly` on the countersigned copy.

## Don't

- Don't treat a drawn signature as proof of identity on its own.
- Don't make the pad smaller than its minimum height – people need room to sign with a finger.
- Don't hide the date when the date matters to the agreement; pass `date` when it isn't today.

## Example

```html
<form>
  <tc-signature-pad
    name="signature"
    required
    allow-typed
    heading="Data-access agreement"
    signer="Noor Haddad, Research fellow"
    statement="By signing, you agree to handle the restricted survey data as set out in section 4."
  ></tc-signature-pad>
  <button type="submit">Sign agreement</button>
</form>

<script type="module">
  import "@adamstavely/trenchcoat/signature-pad";
  import "@adamstavely/trenchcoat/tokens.css";

  const pad = document.querySelector("tc-signature-pad");
  document.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    const svg = pad.toSVG();
    fetch("/api/agreements/42/signature", { method: "POST", body: svg });
  });
</script>
```

```tsx
import { useState } from "react";
import { SignaturePad, type SignatureValue } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function AgreementSignature() {
  const [signature, setSignature] = useState<SignatureValue | null>(null);
  return (
    <form onSubmit={(e) => { e.preventDefault(); void fetch("/api/agreements/42/signature", { method: "POST", body: JSON.stringify(signature) }); }}>
      <SignaturePad
        name="signature"
        required
        allowTyped
        title="Data-access agreement"
        signer="Noor Haddad, Research fellow"
        statement="By signing, you agree to handle the restricted survey data as set out in section 4."
        value={signature}
        onValueChange={setSignature}
      />
      <button type="submit" disabled={!signature}>Sign agreement</button>
    </form>
  );
}
```
