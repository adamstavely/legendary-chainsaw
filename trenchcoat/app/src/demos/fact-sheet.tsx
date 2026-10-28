import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { FactSection } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A customer due-diligence review of a fictional business owner: what the bank knows, where each fact came from and
   how far to trust it. The registered address is in dispute between the company registry and the customer's form.
   "Stack sections" turns off the two columns. */

const SECTIONS: FactSection[] = [
  {
    id: "identity",
    title: "Identity",
    facts: [
      { id: "name", label: "Full name", value: "Elena María Ruiz", source: { label: "Passport", grade: "A1" }, copyable: true },
      { id: "dob", label: "Date of birth", value: "12 April 1981", source: { label: "Passport", grade: "A1" } },
      { id: "nationality", label: "Nationality", value: ["Spanish", "Portuguese (by residence)"], source: { label: "Customer", grade: "B2" } },
      { id: "pep", label: "Politically exposed", value: "No match", source: { label: "Screening", grade: "B1", note: "Checked against three sanctions and PEP lists, 2 Oct 2026" } },
      { id: "tax", label: "Tax residence", source: { label: "Customer", grade: "C3" } },
    ],
  },
  {
    id: "business",
    title: "Business",
    facts: [
      { id: "company", label: "Company", value: "Ruiz & Daughters Ceramics SL", source: { label: "Registry", grade: "A1" }, copyable: true },
      { id: "role", label: "Role", value: "Director, 60% owner", source: { label: "Registry", grade: "A2" } },
      {
        id: "address",
        label: "Registered address",
        value: "Calle de la Loza 14, Valencia",
        source: { label: "Registry", grade: "A2" },
        alternatives: [{ value: "Avenida del Puerto 210, Valencia", source: { label: "Customer", grade: "C3", note: "From the onboarding form, 2023" } }],
      },
      { id: "turnover", label: "Annual turnover", value: "€1.2–1.5 million", source: { label: "Accounts", grade: "B2" } },
      { id: "industry", label: "Industry", value: "Wholesale ceramics", source: { label: "News", grade: "D3" } },
    ],
  },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { FactSheet } = ui;
  const [stacked, setStacked] = useState(false);
  return (
    <div style={{ width: "100%", maxWidth: 860, display: "grid", gap: 8 }}>
      <FactSheet title="Customer profile" description="Due-diligence review · Elena Ruiz" sections={SECTIONS} columns={stacked ? 1 : 2} />
      <div style={{ ...caption, textAlign: "center" }}>
        Open “How grades work” to see the scale, or hover a tag for its meaning.{" "}
        <button type="button" style={textButton} onClick={() => setStacked(!stacked)}>
          {stacked ? "Side by side" : "Stack sections"}
        </button>
      </div>
    </div>
  );
}
