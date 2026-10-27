import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { CorrectionCandidate, CorrectionState } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A reviewer corrected a claim about service credits: the contract caps them at 10%, not 15%. The component finds
   everything that cites the old claim – two released packages and four working documents – as they turn up. One is
   already reviewed. Review, mark superseded or dismiss each; nothing is rewritten on its own. */

const FOUND: CorrectionCandidate[] = [
  { id: "p1", kind: "package", title: "Q3 vendor risk report", version: "v2.1", detail: "Sent to the board · cites it in §4", quote: "Service credits, capped at 15% of monthly fees, offset most of the downtime cost." },
  { id: "a1", title: "Risk memo §2", detail: "Dana Okafor · draft", quote: "Credits are capped at 15%, so the misses cost Acme little." },
  { id: "p2", kind: "package", title: "Procurement brief", version: "v1.4", detail: "Shared with Finance · cites it twice" },
  { id: "a2", title: "Renewal negotiation plan", detail: "Lee Park · cites it in “Our leverage”", quote: "Push the credit cap above 15% as an opening ask." },
  { id: "a3", title: "Board summary, slide 3", detail: "Built from Risk memo §2" },
  { id: "a4", title: "Account team FAQ", detail: "Cites it in one answer", state: "reviewed" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { CorrectionPropagation } = ui;
  const [found, setFound] = useState(2);
  const [states, setStates] = useState<Record<string, CorrectionState>>({});
  const [last, setLast] = useState("");

  // Citations turn up one after another as the search runs; then it stops
  useEffect(() => {
    if (found >= FOUND.length) return;
    const t = setTimeout(() => setFound((n) => n + 1), 450);
    return () => clearTimeout(t);
  }, [found]);

  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 10 }}>
      <CorrectionPropagation
        title="Correction reach"
        claim="Service credits are capped at 15% of monthly fees."
        correction="Service credits are capped at 10% of monthly fees."
        reason="Master agreement §7.2 says ten percent"
        meta="Corrected by Dana Okafor · today, 10:42"
        candidates={FOUND.slice(0, found)}
        states={states}
        onStatesChange={(_, id, state) => setStates((s) => ({ ...s, [id]: state }))}
        onReview={(_, c) => setLast(`Opened “${c.title}” for review`)}
        onSupersede={(_, c) => setLast(c.kind === "package" ? `Superseding notice drafted for ${c.title} ${c.version ?? ""}` : `“${c.title}” marked superseded`)}
        onDismiss={(_, c) => setLast(`“${c.title}” dismissed – it doesn't rely on the claim`)}
      />
      <p style={{ ...caption, margin: 0, textAlign: "center" }}>
        {last || "Each item waits for a person – nothing is rewritten"}{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setFound(2);
            setStates({});
            setLast("");
          }}
        >
          Reset
        </button>
      </p>
    </div>
  );
}
