import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { CapabilityLevel } from "../../../src/elements/react";
import { bubble, caption, surface, textButton } from "../demo-kit";

/* One assistant, three requests. Summarising a contract is well proven – no notice. Estimating a German tax liability
   is partly proven: amber, confidence capped at Medium. Valuing a private company is not proven: red, capped at Low,
   and the team lead was notified. Open "Distance from usual" to see how far each request sits from the usual work. */

type Request = { key: string; tab: string; ask: string; answer: string; level?: CapabilityLevel; area?: string; cap?: string; notified?: string; distance: number };

const REQUESTS: Request[] = [
  {
    key: "summary",
    tab: "Summarise",
    ask: "Summarise the renewal terms in the Northwind contract.",
    answer: "The contract renews each March for twelve months. Either side can end it with 60 days' written notice; prepaid months are credited.",
    distance: 0.18,
  },
  {
    key: "tax",
    tab: "Tax estimate",
    ask: "Estimate our German VAT liability for Q3 from these invoices.",
    answer: "Roughly €41,800, assuming all twelve invoices are standard-rated and none of the buyers is VAT-registered elsewhere in the EU.",
    level: "partial",
    area: "Tax calculations outside the UK",
    cap: "Medium",
    distance: 0.58,
  },
  {
    key: "valuation",
    tab: "Valuation",
    ask: "What's Lumen Labs worth if we acquire it this year?",
    answer: "Somewhere between £18m and £30m, based on revenue multiples for software companies of a similar size.",
    level: "unproven",
    area: "Valuing private companies",
    cap: "Low",
    notified: "Team lead",
    distance: 0.84,
  },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { CapabilityNotice } = ui;
  const [at, setAt] = useState(1);
  const r = REQUESTS[at];

  return (
    <div style={{ width: "100%", maxWidth: 520, display: "grid", gap: 12 }}>
      <div style={{ ...bubble, justifySelf: "end", maxWidth: "85%", padding: "7px 11px", borderRadius: 14, fontSize: 13, lineHeight: 1.45 }}>{r.ask}</div>
      {r.level ? <CapabilityNotice key={r.key} level={r.level} area={r.area} cap={r.cap} notified={r.notified} distance={r.distance} usual={0.45} /> : null}
      <div style={{ ...surface, borderRadius: 12, padding: "10px 12px", fontSize: 13, lineHeight: 1.5 }}>{r.answer}</div>
      <div style={{ ...caption, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <span>{r.level ? "Open “Distance from usual” for the scale" : "A well-proven request – no notice"}</span>
        <span style={{ display: "inline-flex", gap: 10 }}>
          {REQUESTS.map((x, i) => (
            <button key={x.key} type="button" aria-pressed={i === at} onClick={() => setAt(i)} style={{ ...textButton, textDecoration: i === at ? "none" : "underline", fontWeight: i === at ? 600 : undefined }}>
              {x.tab}
            </button>
          ))}
        </span>
      </div>
    </div>
  );
}
