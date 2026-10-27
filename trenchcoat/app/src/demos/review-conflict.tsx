import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ReviewResolution, ReviewVerdict } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* Two reviewers checked the same figure in a market brief and came back with opposite verdicts. As the resolver, pick
   one (or override), give a reason and confirm. Switch to Ana's view to see blind mode: she learns that a conflict
   exists, not who disagreed or how – and after it's resolved, only the outcome. */

const REVIEWS: ReviewVerdict[] = [
  {
    id: "ana",
    reviewer: { name: "Ana Ruiz", role: "Research" },
    verdict: "Supported",
    tone: "positive",
    at: "Today 09:14",
    reason: "Matches the 2025 annual report, page 12: revenue up 18% to €41m.",
  },
  {
    id: "ben",
    reviewer: { name: "Ben Okafor", role: "Finance" },
    verdict: "Not supported",
    tone: "negative",
    at: "Today 10:02",
    reason: "The report was restated in March. Restated growth is 11%, to €38.6m.",
  },
];

type View = "resolver" | "ana";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ReviewConflict } = ui;
  const [view, setView] = useState<View>("resolver");
  const [resolution, setResolution] = useState<ReviewResolution | null>(null);

  return (
    <div style={{ width: "100%", maxWidth: 600, display: "grid", gap: 10 }}>
      <ReviewConflict
        scope="Q3 market brief · claim 14 of 32"
        item="Northwind's revenue grew 18% in 2025, to €41m."
        reviews={REVIEWS}
        difference="Ana checked the original annual report; Ben checked the March restatement."
        blind={view === "ana"}
        viewer={view === "ana" ? "ana" : undefined}
        resolver="Dana Lee"
        resolution={resolution}
        onResolve={(r) => setResolution({ ...r, at: "just now" })}
      />
      <p style={{ ...caption, margin: 0, textAlign: "center" }}>
        {view === "resolver" ? "You're resolving as Dana." : "You're seeing Ana's view – blind."}{" "}
        <button type="button" style={textButton} onClick={() => setView(view === "resolver" ? "ana" : "resolver")}>
          {view === "resolver" ? "See Ana's view" : "Back to the resolver"}
        </button>
        {resolution && (
          <>
            {" "}
            ·{" "}
            <button type="button" style={textButton} onClick={() => setResolution(null)}>
              Reopen
            </button>
          </>
        )}
      </p>
    </div>
  );
}
