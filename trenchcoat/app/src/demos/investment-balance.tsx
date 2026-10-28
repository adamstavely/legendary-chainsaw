import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { InvestmentTier } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's FY26 portfolio by priority tier. "Rebalance" moves budget and people from the top tier
   towards High, so the flags and the finding update. */

const NOW: InvestmentTier[] = [
  { id: "p1", badge: "1", label: "Top priority", items: 18, budget: 14_200_000, people: 38 },
  { id: "p2", badge: "2", label: "High", items: 46, budget: 16_800_000, people: 49 },
  { id: "p3", badge: "3", label: "Medium", items: 64, budget: 9_700_000, people: 32 },
  { id: "p4", badge: "4", label: "Watching", items: 72, budget: 6_800_000, people: 23 },
];
const REBALANCED: InvestmentTier[] = [
  { id: "p1", badge: "1", label: "Top priority", items: 18, budget: 9_100_000, people: 24 },
  { id: "p2", badge: "2", label: "High", items: 46, budget: 15_200_000, people: 44 },
  { id: "p3", badge: "3", label: "Medium", items: 64, budget: 13_400_000, people: 43 },
  { id: "p4", badge: "4", label: "Watching", items: 72, budget: 9_800_000, people: 31 },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { InvestmentBalance } = ui;
  const [plan, setPlan] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const tier = (plan ? REBALANCED : NOW).find((t) => t.id === selected);
  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 8 }}>
      <InvestmentBalance tiers={plan ? REBALANCED : NOW} selected={selected} onSelectedChange={setSelected} />
      <div style={{ ...caption, textAlign: "center" }}>
        {tier ? `${tier.label}: ${tier.items} topics. ` : "Pick a tier, or move with the arrow keys and press Enter. "}
        <button type="button" style={textButton} onClick={() => setPlan(!plan)}>
          {plan ? "Back to FY26 as allocated" : "Try a rebalanced plan"}
        </button>
      </div>
    </div>
  );
}
