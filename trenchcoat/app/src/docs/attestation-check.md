---
pattern: none
status: new
related: dropzone, run-manifest, lineage-graph, correction-propagation
---

## Overview

Verify a signed evidence package before you rely on it. Paste the package's hash, or drop the package file, and the
app's `verify` function checks it in the page: the signature, the integrity of its hash chain, and whether it covers
what it claims to. The result is a plain verdict – valid, or invalid with the checks that failed and why. The file
never leaves the page: the element hands it to `verify` and nothing else.

## When to use

- Letting someone who received a released package confirm it hasn't been changed since it was signed.
- Checking an evidence bundle before it's attached to a decision, a filing or a review.
- Anywhere a hash or file must be verified without uploading it.

## When not to use

- Uploading files to keep or process – use `dropzone`.
- Showing what a run used and produced – use `run-manifest`.
- Tracing where an output came from – use `lineage-graph`.

## Anatomy

1. **Bar** `.ui-atc__bar` – the heading
2. **Drop area** `.ui-atc__area` – drop a package file or browse for one; says where it's checked
3. **Hash** `.ui-atc__hash` – paste a hash and Verify
4. **Verdict** `.ui-atc__verdict` – valid or invalid, and the package's name
5. **Checks** `.ui-atc__checks` – signature, chain integrity and coverage, each passed, failed or not checked
6. **Foot** `.ui-atc__foot` – “Checked locally” and Check another

## Looks

Standard sets the card on a gray tray with a dashed, recessed drop area; the verdict is a tinted panel with a bold
title. Clean is one white card under a plain bar, with a hairline-dashed drop area, thinner icons and medium weights.
Both colour the verdict green or red and mark each check with a tick, a cross or a dash.

## Keyboard

Every control is native: a button for the drop area, a labelled text field and a submit button.

| Key | What it does |
|---|---|
| Tab / Shift + Tab | Moves between the drop area, the hash field, Verify and, once there's a result, Copy hash and Check another |
| Enter / Space on the drop area | Opens the file picker |
| Enter in the hash field | Verifies the hash (the field is checked first) |

When a check finishes, focus moves to the verdict; Check another returns it to the drop area.

## Screen readers

The component is a region named by its heading. The drop area is a button, “Drop a package file or browse”, described
by the hint, “Checked in this browser – the file isn't uploaded”. The hash field is labelled “Package hash”; an
invalid entry sets `aria-invalid` and is described by the error. While checking, the panel is `aria-busy`. A polite
status says “Checking the hash…”, then “Valid: the package is intact and signed.” or “Invalid: chain integrity, coverage
failed.”. The checks are a list, “Checks”, each item reading like “Chain integrity: failed, Link 17 doesn't match”.
A verify that throws shows an alert, “Couldn't check this package.”, with Try again.

## Content

- Write each check's `detail` as what was found: “42 of 42 links intact”, “Link 17 doesn't match link 16”.
- Give `reasons` in plain words for an invalid package – what changed or what's missing, not error codes.
- List what a package covers in `coverage.items`, briefly: “Run manifest”, “14 source chunks”.
- Keep the `hint` about where the check happens; people need to know the file stays with them.

## Do

- Do the whole check inside `verify`, in the page – hash the file with `crypto.subtle` and check the signature locally.
- Leave a check unset when you didn't run it, so it reads “Not checked” instead of passing silently.
- Throw from `verify` with a clear message when you can't check at all (a missing key), rather than returning invalid.

## Don't

- Don't upload the file in `verify`; the hint promises it isn't.
- Don't return `valid: true` when any check failed.
- Don't loosen `hashPattern` to accept anything – a clear error beats a confusing “not found”.

## Example

```html
<tc-attestation-check id="check"></tc-attestation-check>

<script type="module">
  import "trenchcoat/attestation-check";
  import "trenchcoat/tokens.css";

  const check = document.querySelector("#check");
  check.verify = async (input) => {
    const bytes = typeof input === "string" ? null : await input.arrayBuffer();
    const ok = bytes !== null && bytes.byteLength > 0;
    return { valid: ok, signature: { ok, detail: ok ? "Signature matches the release key" : "No signature found" } };
  };
  check.addEventListener("tc-result-change", (e) => console.log(e.detail.result?.valid));
</script>
```

```tsx
import { AttestationCheck, type AttestationResult } from "trenchcoat/react";
import "trenchcoat/tokens.css";

async function verify(input: string | File): Promise<AttestationResult> {
  const data = typeof input === "string" ? new TextEncoder().encode(input) : await input.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", data);
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return { valid: false, hash: `sha256:${hex}`, signature: { ok: false, detail: "No signature found" } };
}

export function VerifyPackage() {
  return <AttestationCheck verify={verify} accept={[".evidence"]} onResultChange={(r) => console.log(r?.valid)} />;
}
```
