import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { TrustCertification, TrustDocument, TrustDpa, TrustFaq } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* The trust center of a fictional AI workspace vendor, as a research institute's security reviewer sees it: two
   frameworks held and one in progress, public and NDA-only documents, a DPA still to sign, and common questions.
   Request access marks a document Requested; Review and sign stands in for the signing flow. */

const CERTIFICATIONS: TrustCertification[] = [
  { id: "iso", name: "ISO 27001", status: "certified", period: "May 2026 – May 2029", auditor: "Halden Assurance" },
  { id: "soc", name: "SOC 2 Type II", status: "certified", period: "Jan – Dec 2026", auditor: "Mercer & Vale" },
  { id: "iso42", name: "ISO 42001", status: "in-progress", period: "Expected Q2 2027" },
  { id: "csa", name: "CSA STAR Level 2", status: "planned" },
];

const DOCUMENTS: TrustDocument[] = [
  { id: "overview", title: "Security overview", description: "How the workspace protects customer data", access: "public", href: "#security-overview", updated: Date.UTC(2026, 9, 2) },
  { id: "pentest", title: "Penetration test summary", description: "External test, September 2026", access: "request", nda: true, updated: Date.UTC(2026, 8, 28) },
  { id: "soc-report", title: "SOC 2 Type II report", access: "request", nda: true, updated: Date.UTC(2026, 0, 30) },
  { id: "policies", title: "Information security policies", description: "Access control, retention and incident response", access: "public", href: "#policies" },
];

const FAQS: TrustFaq[] = [
  { id: "train", question: "Is our data used to train models?", answer: "No. Customer content is never used for training, and model providers are contracted not to retain it." },
  { id: "where", question: "Where is our data stored?", answer: "In the region you choose when the workspace is created – the EU (Ireland) or the US (Virginia)." },
  { id: "breach", question: "How quickly are we told about an incident?", answer: "Within 48 hours of confirming an incident that affects your data, as the DPA sets out." },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { TrustCenter } = ui;
  const [dpa, setDpa] = useState<TrustDpa>({ status: "not-signed", version: "v3.1" });
  const [note, setNote] = useState("");
  return (
    <div style={{ width: "100%", maxWidth: 720, display: "grid", gap: 8 }}>
      <TrustCenter
        title="Trust center"
        description="Quanta Workspace · for Halvorsen Research Institute"
        certifications={CERTIFICATIONS}
        documents={DOCUMENTS}
        dpa={dpa}
        faqs={FAQS}
        defaultOpen={["train"]}
        lastUpdated={Date.UTC(2026, 10, 3)}
        onRequest={(_id, d) => setNote(`Access requested: ${d.title}.`)}
        onDocumentOpen={(_id, _href, d) => {
          setNote(`Opened ${d.title}.`);
          return false;
        }}
        onDpaSign={() => {
          setDpa({ status: "signed", version: "v3.1", signedAt: Date.UTC(2026, 10, 12), signedBy: "Priya Shah" });
          setNote("DPA signed.");
        }}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {note || "Request a document, or review and sign the DPA."}{" "}
        {dpa.status === "signed" ? (
          <button type="button" style={textButton} onClick={() => (setDpa({ status: "not-signed", version: "v3.1" }), setNote(""))}>
            Start over
          </button>
        ) : null}
      </div>
    </div>
  );
}
