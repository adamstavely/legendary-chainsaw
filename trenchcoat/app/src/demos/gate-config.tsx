import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { GateConfigValue, GateCondition } from "../../../src/elements/react";
import { buttonSm, caption } from "../demo-kit";

/** A support team's refund agent: what makes it stop and ask */
const CONDITIONS: GateCondition[] = [
  { id: "low-confidence", label: "Confidence is low", description: "The agent rates its own answer under 70%" },
  { id: "amount", label: "The refund is over $250", description: "Larger refunds always get a second look" },
  { id: "irreversible", label: "Money leaves the account", description: "Refunds to a card can't be pulled back" },
  { id: "no-source", label: "A claim has no source", description: "The reply cites a policy it didn't retrieve" },
  { id: "vip", label: "The customer is on an enterprise plan", description: "Account managers want to know first" },
];

const EXAMPLES: { label: string; heading: string; description: string; value: GateConfigValue }[] = [
  {
    label: "Refunds",
    heading: "Before a refund goes out",
    description: "Step 4 · Review · Refund requests",
    value: { triggers: ["amount", "irreversible"], reviewer: "lead", view: "evidence", actions: ["approve", "edit", "send-back", "reject"], reason: "Refunds can't be pulled back once they reach the card – a person checks the amount against the order." },
  },
  {
    label: "Policy answers",
    heading: "Before the reply is sent",
    description: "Step 5 · Review · Billing questions",
    value: { triggers: ["low-confidence", "no-source"], reviewer: "on-call", view: "evidence", actions: ["approve", "edit", "send-back"], reason: "Customers quote our replies back to us. Anything not grounded in the policy pages gets checked." },
  },
  {
    label: "Nothing set",
    heading: "New review gate",
    description: "Step 3 · Review",
    value: { triggers: [], reviewer: "", view: "output", actions: [], reason: "" },
  },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { GateConfig } = ui;
  const [pick, setPick] = useState(0);
  const [value, setValue] = useState<GateConfigValue>(EXAMPLES[0].value);
  const ex = EXAMPLES[pick];
  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 12 }}>
      <GateConfig title={ex.heading} description={ex.description} conditions={CONDITIONS} value={value} onChange={setValue} name="gate" />
      <div style={{ ...caption, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
        {EXAMPLES.map((x, i) => (
          <button
            key={x.label}
            type="button"
            style={buttonSm}
            aria-pressed={i === pick}
            onClick={() => {
              setPick(i);
              setValue(x.value);
            }}
          >
            {x.label}
          </button>
        ))}
      </div>
    </div>
  );
}
