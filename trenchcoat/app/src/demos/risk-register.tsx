import type * as UI from "../../../src/elements/react";
import type { Risk } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* The risk register of a fictional reef-restoration field programme. Three risks have moved since the last review, so
   the grid shows where they came from. Pick a cell to filter, a risk to open it and rescore it. All made up. */

const RISKS: Risk[] = [
  {
    id: "storm",
    title: "Storm season damages nursery frames",
    likelihood: 4,
    impact: 4,
    owner: "M. Okafor",
    status: "mitigating",
    trend: "up",
    previous: { likelihood: 3, impact: 4 },
    mitigation:
      "Anchor frames to the new rubble-stabilised beds before November; keep two spare frames ashore.",
  },
  {
    id: "bleach",
    title: "Marine heatwave causes bleaching",
    likelihood: 3,
    impact: 5,
    owner: "L. Tran",
    status: "open",
    trend: "flat",
    mitigation:
      "Daily temperature logs; move heat-tolerant fragments to the deeper nursery when alerts trigger.",
  },
  {
    id: "permit",
    title: "Collection permit renewal delayed",
    likelihood: 2,
    impact: 4,
    owner: "R. Haddad",
    status: "mitigating",
    trend: "down",
    previous: { likelihood: 4, impact: 4 },
    mitigation:
      "Application filed early with the authority; fall back to the existing donor colonies.",
  },
  {
    id: "boat",
    title: "Survey boat out of service",
    likelihood: 3,
    impact: 2,
    owner: "J. Silva",
    status: "accepted",
    trend: "flat",
  },
  {
    id: "divers",
    title: "Too few certified volunteer divers",
    likelihood: 3,
    impact: 3,
    owner: "A. Mensah",
    status: "open",
    trend: "up",
    previous: { likelihood: 2, impact: 3 },
  },
  {
    id: "data",
    title: "Monitoring data lost between sites",
    likelihood: 2,
    impact: 3,
    owner: "L. Tran",
    status: "mitigating",
    trend: "down",
    mitigation:
      "Nightly upload from the field tablets to the institute's server.",
  },
  {
    id: "funding",
    title: "Second-year funding not confirmed",
    likelihood: 2,
    impact: 5,
    owner: "R. Haddad",
    status: "open",
    trend: "flat",
  },
  {
    id: "disease",
    title: "Coral disease outbreak in nursery",
    likelihood: 1,
    impact: 4,
    owner: "M. Okafor",
    status: "open",
  },
  {
    id: "kit",
    title: "Dive kit servicing overdue",
    likelihood: 4,
    impact: 1,
    owner: "J. Silva",
    status: "closed",
    trend: "down",
  },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { RiskRegister } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 900, display: "grid", gap: 10 }}>
      <RiskRegister
        title="Reef restoration – field risks"
        description="Reviewed monthly · last review 3 October"
        defaultRisks={RISKS}
        defaultSelected="storm"
      />
      <div style={{ ...caption, textAlign: "center" }}>
        Pick a cell to filter the register, or open a risk and rescore it.
        Dashed arrows show moves since the last review.
      </div>
    </div>
  );
}
