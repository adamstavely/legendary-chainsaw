import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { InspectorStep, StepRun, UpstreamStep } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* "Post to ledger" in a fictional research institute's invoice workflow: the amount and vendor come from the
   extraction step, the account is chosen, and the cost centre still needs a value before it can be tested. */

const UPSTREAM: UpstreamStep[] = [
  { id: "received", title: "Invoice received", kind: "trigger", outputs: [{ name: "sender", type: "text", sample: "billing@northwind-labs.example" }, { name: "attachment", type: "file", sample: "INV-20417.pdf" }] },
  {
    id: "extract",
    title: "Extract fields",
    kind: "llm",
    outputs: [
      { name: "vendor", type: "text", sample: "Northwind Labs" },
      { name: "amount", type: "number", sample: "12,480.00" },
      { name: "po_number", type: "text", sample: "PO-7731" },
    ],
  },
  { id: "match", title: "Match purchase order", kind: "tool", outputs: [{ name: "po_status", type: "text", sample: "Open" }, { name: "budget_line", type: "text", sample: "Lab equipment" }] },
];

const START: InspectorStep = {
  id: "post",
  kind: "output",
  title: "Post to ledger",
  inputs: [
    { id: "amount", label: "Amount", type: "number", required: true, source: { kind: "ref", ref: "extract.amount" } },
    { id: "vendor", label: "Vendor", required: true, source: { kind: "ref", ref: "extract.vendor" } },
    { id: "account", label: "Account", type: "select", required: true, options: ["5100 – Lab equipment", "6100 – Professional services", "6400 – Travel"], source: { kind: "value", value: "5100 – Lab equipment" } },
    { id: "cost-centre", label: "Cost centre", required: true, description: "The team the spend is charged to, e.g. CC-210", placeholder: "CC-000" },
    { id: "memo", label: "Memo", type: "long", placeholder: "Shown on the ledger entry" },
  ],
};

const RUN: StepRun = {
  status: "succeeded",
  duration: "1.4 s",
  input: { amount: 12480, vendor: "Northwind Labs", account: "5100", cost_centre: "CC-210" },
  output: { entry_id: "GL-2026-11-0412", posted: true, period: "2026-11" },
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { StepInspector } = ui;
  const [step, setStep] = useState<InspectorStep>(START);
  const [testing, setTesting] = useState(false);
  const [run, setRun] = useState<StepRun | null>(null);
  useEffect(() => {
    if (!testing) return;
    const t = setTimeout(() => {
      setRun(RUN);
      setTesting(false);
    }, 900);
    return () => clearTimeout(t);
  }, [testing]);
  return (
    <div style={{ width: "100%", maxWidth: 520, display: "grid", gap: 8 }}>
      <StepInspector step={step} upstream={UPSTREAM} lastRun={run} testing={testing} onStepChange={setStep} onTest={() => setTesting(true)} />
      <div style={{ ...caption, textAlign: "center" }}>
        Map an input from an earlier step, or type a value. Fill the cost centre to test.{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setStep(START);
            setRun(null);
          }}
        >
          Start over
        </button>
      </div>
    </div>
  );
}
