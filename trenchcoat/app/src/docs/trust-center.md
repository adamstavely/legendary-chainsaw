---
pattern: disclosure
status: new
related: data-handling-policy, attestation-check, terms-dialog, document-list
---

## Overview

What a vendor shows a customer's security reviewer, on one card:
- **Certifications and frameworks:** each one's name as text, its status in words – Certified, In progress or
  Planned – and the period it covers and who audited it.
- **Security documents:** public ones to view, and the rest behind Request access, with NDA required said in words.
- **The Data Processing Agreement:** Review and sign, or when it was signed and by whom.
- **Common questions:** each a disclosure.

The header says when the trust center was last updated. There are no third-party logos: names are text, and the page
may give a certification its own image.

## When to use

- A vendor's security page, inside the product or on its site, for customers doing due diligence.
- An admin's "Security and compliance" page, where the DPA is signed.
- A procurement workflow that collects a vendor's evidence before approval.

## When not to use

- Your organisation's own data-handling rules – use `data-handling-policy`.
- Checking that a signed evidence package is genuine – use `attestation-check`.
- Agreeing to terms before using a product – use `terms-dialog`.
- A person's identity or record documents – use `document-list`.

## Anatomy

1. **Certification** `.ui-tcn__cert` – a framework's name, period and auditor
2. **Status** `.ui-tcn__pill` – Certified, In progress or Planned, as a tint, a mark and a word
3. **Document** `.ui-tcn__doc` – a security document with its access
4. **NDA required** `.ui-tcn__nda` – said in words, with a lock
5. **View** `.ui-tcn__view` – opens a public or granted document
6. **Request access** `.ui-tcn__request` – asks for a document; it then says Requested
7. **DPA** `.ui-tcn__dpa` – the agreement's status and Review and sign
8. **Question** `.ui-tcn__faq-q` – opens or closes its answer
9. **Answer** `.ui-tcn__faq-a` – the answer, shown when open

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the
header as its first row. Certifications are tinted tiles in both; Review and sign is the one primary button.

## Keyboard

The documents' actions are one tab stop, and so are the questions; inside each, the arrows move.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next document's action, or question |
| Home / End | Moves to the first or last |
| Enter / Space | Views or requests a document; opens or closes a question; Review and sign |
| Tab | Moves to the next group: documents, the DPA, the questions |

## Screen readers

Each section is a region named by its heading: Certifications and frameworks, Security documents, Data Processing
Agreement, Common questions. Certification statuses read as words, and the auditor reads as "Auditor Halden
Assurance". View and Request access include the document's title in their names ("Request access Penetration test
summary"). A document that was requested reads "Requested". Questions are buttons with `aria-expanded`, inside
headings, controlling their answers. Requesting access is confirmed in a polite status message.

## Content

- Name certifications the way they're written: "ISO 27001", "SOC 2 Type II".
- Give `period` the dates the certificate covers, or "Expected Q2 2027" for one in progress.
- Mark every document that needs an NDA with `nda`, so nobody requests it and is surprised.
- Keep answers to two or three sentences, and link to the full documents for more.

## Do

- Say when the trust center was last updated with `lastUpdated`.
- Mark a document `requested` in your data once the request is logged, so it stays marked on the next visit.
- Show the DPA's version, so reviewers know which one they're signing.

## Don't

- Don't draw other companies' logos for certifications; the name as text is enough.
- Don't list a certification as Certified once it has lapsed.
- Don't put confidential documents behind View; use Request access.

## Example

```html
<tc-trust-center id="trust" heading="Trust center"></tc-trust-center>

<script type="module">
  import "@adamstavely/trenchcoat/trust-center";
  import "@adamstavely/trenchcoat/tokens.css";

  const trust = document.querySelector("#trust");
  trust.certifications = [
    { id: "iso", name: "ISO 27001", status: "certified", period: "May 2026 – May 2029", auditor: "Halden Assurance" },
    { id: "iso42", name: "ISO 42001", status: "in-progress", period: "Expected Q2 2027" },
  ];
  trust.documents = [
    { id: "overview", title: "Security overview", access: "public", href: "#overview" },
    { id: "pentest", title: "Penetration test summary", access: "request", nda: true },
  ];
  trust.dpa = { status: "not-signed", version: "v3.1" };
  trust.faqs = [{ id: "train", question: "Is our data used to train models?", answer: "No – never." }];
  trust.addEventListener("tc-request", (e) => console.log("request", e.detail.id));
  trust.addEventListener("tc-dpa-sign", () => console.log("sign the DPA"));
</script>
```

```tsx
import { TrustCenter, type TrustCertification, type TrustDocument } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const certifications: TrustCertification[] = [{ id: "iso", name: "ISO 27001", status: "certified", period: "May 2026 – May 2029" }];
const documents: TrustDocument[] = [{ id: "pentest", title: "Penetration test summary", access: "request", nda: true }];

export function Trust() {
  return (
    <TrustCenter
      title="Trust center"
      certifications={certifications}
      documents={documents}
      dpa={{ status: "not-signed", version: "v3.1" }}
      onRequest={(id) => console.log("request", id)}
      onDpaSign={(dpa) => console.log("sign", dpa.version)}
    />
  );
}
```
