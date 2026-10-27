---
pattern: dialog
status: new
related: dialog, setup-guide, stepper-form, version-history
---

## Overview

A modal for agreeing to terms – terms of service, a privacy policy, an AI acceptable use policy. It opens on the
text, laid out for reading: the version and the date it takes effect in the header, numbered sections with a jump
list beside them (a Contents button above them when narrow), and the consents and Accept at the foot. When someone
agreed to an earlier version, a short "What's changed" comes first, each change linked to its section, and the changed
sections are marked Updated. Accept waits until every required box is checked – and, if you ask, until the text has
been read to the end – and says why it's waiting. The app owns the text and the record: the dialog hands over the
version and the consents and stores nothing.

## When to use

- The first time someone agrees to your terms, at sign-up or before a feature that needs its own terms.
- Asking people to agree again after the terms change, with what changed up front.
- A must-accept gate (`blocking`): nothing else in the product works until the person agrees.
- Collecting an optional consent at the same moment, such as product updates, beside the required one.

## When not to use

- A short confirmation of one action ("Delete this project?") – use `dialog`.
- Consent spread over several steps of setup, with other questions in between – use `stepper-form`.
- Showing the history of a policy's versions and what each changed – use `version-history`.
- A checklist of things to do before going live – use `setup-guide`.

## Anatomy

1. **Header** `.tc-head` – the title, version and date, Updated when agreeing again, Print, Download and Close
2. **Jump list** `.ui-tdlg__toc` – the sections, the one being read marked; a Contents button when narrow
3. **What's changed** `.ui-tdlg__changes` – when agreeing again: each change, linked to its section
4. **Text** `.ui-tdlg__doc` – the sections, with a hairline above that fills as the reader goes
5. **Consents** `.ui-tdlg__consents` – the boxes to check, required ones marked
6. **Reason** `.ui-tdlg__why` – why Accept is waiting, beside it
7. **Actions** `.ui-tdlg__acts` – Not now (or Decline) and Accept

## Looks

Standard puts the header and the consents on the gray tray, with the text on a white card between them and the jump
list on a light well; the section being read is a small raised chip. Clean is one white surface divided by hairlines:
the jump list marks the current section with a thin accent rule, What's changed is set off by a rule instead of a
tinted box, headings are lighter and the icons thinner. Both narrow to the same single column: the jump list folds
into a Contents button over the text, and the actions stack full width.

## Keyboard

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves between the controls; the page behind is inert, so focus stays in the dialog |
| ↑ ↓ PageUp PageDown Space Home End | Scroll the text – it has focus when the dialog opens |
| Enter (jump list) | Moves to that section and puts focus on its heading |
| Enter / Space (Contents, narrow) | Opens or closes the jump list |
| Escape (jump list open, narrow) | Closes the jump list and returns to the Contents button |
| Space (consent) | Checks or unchecks it |
| Enter / Space (Accept, waiting) | Accepts nothing; moves focus to the first unchecked required box, or to the text when it hasn't been read to the end |
| Escape | Asks to close (a cancelable `tc-open-change`) – not when `blocking`, and not while the acceptance is saving |

Focus goes back to what opened the dialog when it closes.

## Screen readers

The native `dialog` is modal and named by the heading ("Terms of Service"). The text is a focusable region named
"Terms of Service text"; each section is a region named by its heading ("2. Your account Updated"). The jump list is
a navigation landmark named "Contents"; the section being read has `aria-current="location"` and changed ones end in
"(updated)". The Contents button has `aria-expanded` and `aria-controls`. The consents are a group named "Your
agreement"; required boxes are `required`, and one that held Accept back is `aria-invalid` after Accept is pressed.
While Accept waits it stays focusable with `aria-disabled="true"` and is described by the reason ("Read to the end and
check “I agree to the Terms of Service” to accept."). A polite status says what happened: the reason again when
Accept is pressed too early, "You can accept now.", "You've reached the end. You can accept now." and "Saving…". A
failure is an alert ("Couldn't record your acceptance. Your choices are kept.") with Try again, which takes focus.
While saving, the dialog is `aria-busy`.

## Content

- Title the dialog with the document's name – "Terms of Service", "AI acceptable use policy" – not "Please read".
- Give `version` and `effectiveDate` as people should read them ("4.0", "1 November 2026"); use `dateLabel="Last
  updated"` when that's the date you have.
- Write each change as one plain sentence of what it means for the reader – "Messages sent to more than 100 people
  now need a person to review them first" – and link it to its section with `section`.
- Keep section headings short – they are the jump list. Put the detail in the body.
- Label consents in the first person: "I agree to the Terms of Service". Make only the agreement itself required;
  marketing consents are optional.
- Use "Not now" when people can come back later, and "Decline" when declining has a consequence the text explains.

## Do

- Record what tc-accept carries – the version and every consent, checked or not – with the time on your server.
- Use `recordAcceptance` (or `pending` and `error`) so a failed save is visible and can be retried; the dialog keeps
  the boxes as they were.
- Use `requireScroll` only where the law or your policy needs proof of reading, and keep such texts short.
- Offer Download or Print for long terms, and serve the same version that was shown.

## Don't

- Don't pre-check required boxes – agreement has to be the person's own action.
- Don't bundle optional consents into the required one.
- Don't use `blocking` for terms people can reasonably postpone; it stops them doing anything else.
- Don't show a different text in the dialog from the one you store against the version.

## Example

```html
<tc-terms-dialog id="terms" heading="Terms of Service" version="4.0" effective-date="1 November 2026"
  require-scroll downloadable></tc-terms-dialog>

<script type="module">
  import "trenchcoat/terms-dialog";
  import "trenchcoat/tokens.css";

  const terms = document.querySelector("#terms");
  terms.sections = [
    { id: "account", heading: "Your account", body: "You need an account to use the service.\n\n- You must be 16 or older." },
    { id: "content", heading: "Your content", body: "What you create stays yours." },
  ];
  terms.consents = [
    { id: "terms", label: "I agree to the Terms of Service", required: true },
    { id: "updates", label: "Send me product updates" },
  ];
  terms.recordAcceptance = (detail, signal) =>
    fetch("/api/acceptances", { method: "POST", body: JSON.stringify(detail), signal }).then((r) => {
      if (!r.ok) throw new Error(r.statusText);
    });
  terms.addEventListener("tc-download", () => window.open("/legal/terms-4.0.pdf"));
  terms.open = true;
</script>
```

```tsx
import { useState } from "react";
import { TermsDialog, type TermsAcceptDetail, type TermsDialogSection } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const sections: TermsDialogSection[] = [
  { id: "review", heading: "Allowed with human review", changed: true, body: <p>Some uses need a person to check the output first.</p> },
  { id: "data", heading: "Personal data in prompts", body: "Only include personal data you're allowed to process." },
];

export function PolicyGate({ save }: { save: (detail: TermsAcceptDetail) => Promise<void> }) {
  const [open, setOpen] = useState(true);
  return (
    <TermsDialog
      open={open}
      onOpenChange={setOpen}
      heading="AI acceptable use policy"
      version="3.0"
      effectiveDate="1 December 2026"
      previousVersion="2.1"
      changes={[{ text: "Messages to more than 100 people need review first.", section: "review" }]}
      sections={sections}
      consents={[{ id: "policy", label: "I agree to the AI acceptable use policy", required: true }]}
      blocking
      canDecline={false}
      recordAcceptance={(detail) => save(detail)}
    />
  );
}
```
