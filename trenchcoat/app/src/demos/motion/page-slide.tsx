import { useState } from "react";
import type * as UI from "../../../../src/elements/react";
import { buttonSm, caption, surface } from "../../demo-kit";

const STEPS = [
  { key: "scope", title: "Scope", body: ["Vendor payments, July to September", "Three cost centres, 1,180 transactions"] },
  { key: "evidence", title: "Evidence", body: ["Bank statements matched for 1,142 payments", "38 payments still need an invoice", "Two vendors share one bank account"] },
  { key: "sign-off", title: "Sign-off", body: ["Reviewer: Audit team B"] },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { PageSlide } = ui;
  const [at, setAt] = useState(0);
  const step = STEPS[at];
  return (
    <div style={{ ...surface, width: "100%", maxWidth: 380, borderRadius: 12, padding: 16, fontSize: 13 }}>
      <div style={{ ...caption, marginBottom: 8 }}>
        Review F-214 · step {at + 1} of {STEPS.length}
      </div>
      <PageSlide view={step.key} order={STEPS.map((s) => s.key)} focusHeading>
        <h3 style={{ margin: "0 0 6px", fontSize: 15 }}>{step.title}</h3>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          {step.body.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </PageSlide>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
        <button type="button" style={buttonSm} disabled={at === 0} onClick={() => setAt(at - 1)}>
          Back
        </button>
        <button type="button" style={buttonSm} disabled={at === STEPS.length - 1} onClick={() => setAt(at + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
