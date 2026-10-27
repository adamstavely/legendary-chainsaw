---
pattern: none
status: stable
related: stepper-form, setup-guide, button
---

## Overview

The field for a one-time verification code sent by text message or email. People type, paste or let the phone
autofill the code, and see it as one box per character with a focus ring that glides to the next box. When the last
box is filled the field can check the code itself: it shows that it's verifying, shakes and clears a wrong code for
another try, and folds the boxes into a single “Verified” pill when it's right. A “Resend code” link counts down
below. It is a form control: it submits the code under `name`, checks `required`, and resets with the form.

## When to use

- Two-step sign-in, confirming a phone number or email address, approving a sensitive action.
- Any short code of fixed length – usually 4 to 8 digits, or letters and digits with `numeric="false"`.
- Flows where the code is checked as soon as it's complete, without a separate submit button.

## When not to use

- Passwords, PINs people chose themselves, or codes of unknown length – use a plain text field.
- A multi-step sign-up where the code is one step of several – put this field inside `stepper-form`.
- Picking a value from a list – use `combobox`.

## Anatomy

1. **Field** `.ui-otp__slots` – the boxes together; one real input lies underneath them
2. **Box** `.ui-otp__sep + .ui-otp__box` – one character of the code; the focus ring glides to the box the next one goes into
3. **Separator** `.ui-otp__sep` – the small dash between groups, with `separator`
4. **Resend** `.ui-otp__resend` – the countdown, then “Resend code”, with `resendable`

A wrong code adds the error message below the boxes; a right one folds them into the success pill.

## Looks

Standard draws gray boxes that turn white as they fill, with a dark ink ring and a soft halo around the active box,
and an underlined text link for “Resend code”. Clean draws white boxes with the field edge, a thin blue outline that
glides between them, and a tab-style “Resend code” button. Both shake on an error and fold into the same success
pill.

## Keyboard

| Key | What it does |
|---|---|
| A digit (or letter) | Fills the active box and moves to the next |
| Backspace | Removes the character in the active box, or the one before it when the box is empty |
| ← / → | Moves to the previous or next box (up to the first empty one) |
| Home / ↑ | Moves to the first box |
| End / ↓ | Moves to the first empty box, or the last box when the code is complete |
| Ctrl / ⌘ + V | Pastes a code: a whole code fills every box, a part fills from the active box on |
| Tab | Moves on; with `resendable`, to “Resend code” once the countdown is over |

## Screen readers

The boxes are one real text input with `autocomplete="one-time-code"`, so it's read as a single field: “Verification
code, 6 digits” by default, or the text of `labelledBy` or a page `<label for>` followed by “6 digits”. A wrong code
sets `aria-invalid` and describes the field with the error message. A polite live region says “Verifying code”,
the error message (“That code didn't work. Try again.”), the success label (“Verified”), “A new code is on its way”
after a resend and “You can resend the code now” when the countdown ends.

## Content

- Name the field with a visible heading or label and point `labelledBy` at it: “Check your phone”, “Enter the code”.
- Say where the code went next to the field: “We sent a 6-digit code to •••• 4821”.
- Write the error as what happened and what to do: “That code didn't work. Try again.” – not “Invalid OTP”.
- Make `successLabel` specific when it can be: “Phone verified”, “Email confirmed”.

## Do

- Return a promise from `onComplete` and let the field show verifying, error and success on its own.
- Set `length` to the code your service sends, and `separator` for 6- and 8-digit codes so they read in halves.
- Turn on `resendable` and listen for `tc-resend`, with `resendIn` matching your service's rate limit.

## Don't

- Don't add a separate “Verify” button the field makes unnecessary – it checks as soon as the last box is filled.
- Don't move focus into the field on page load unless the code step is the whole page (`auto-focus`).
- Don't turn off `clearOnError` without a reason; people expect to retype a wrong code from the first box.

## Example

```html
<h2 id="code-title">Check your phone</h2>
<form>
  <tc-otp-input id="code" name="code" separator labelled-by="code-title" resendable></tc-otp-input>
</form>

<script type="module">
  import "trenchcoat/otp-input";
  import "trenchcoat/tokens.css";

  const field = document.querySelector("#code");
  field.onComplete = (code, { signal }) => fetch(`/api/verify?code=${code}`, { signal }).then((r) => {
    if (!r.ok) throw new Error("wrong code");
  });
  field.addEventListener("tc-resend", () => fetch("/api/resend", { method: "POST" }));
</script>
```

```tsx
import { OtpInput } from "trenchcoat/react";
import "trenchcoat/tokens.css";

async function verify(code: string) {
  const res = await fetch("/api/verify", { method: "POST", body: JSON.stringify({ code }) });
  if (!res.ok) throw new Error("wrong code");
}

export function VerifyPhone() {
  return (
    <section>
      <h2 id="verify-title">Check your phone</h2>
      <OtpInput
        name="code"
        separator
        labelledBy="verify-title"
        successLabel="Phone verified"
        onComplete={(code) => verify(code)}
        onResend={() => fetch("/api/resend", { method: "POST" })}
      />
    </section>
  );
}
```
