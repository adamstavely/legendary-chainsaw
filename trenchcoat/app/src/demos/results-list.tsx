import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { SearchResult } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* What a search of a fictional marine research institute's archive found for "coral bleaching": grant reports and lab
   notes, a person, an email – grouped by kind, the query's words marked. "Did you mean" is offered for the typo in
   the second query. All names and links are made up. */

const day = 86_400_000;
const AT = Date.UTC(2026, 9, 24, 12);
const RESULTS: SearchResult[] = [
  { id: "r1", kind: "Document", title: "Coral bleaching survey – Reef Station 4, spring 2026", snippet: "Bleaching affected 38% of colonies on the outer reef; recovery was fastest where coral cover stayed above 20%.", source: "Grant reports", date: AT - 3 * day, href: "https://archive.example.org/reports/rs4-2026" },
  { id: "r2", kind: "Document", title: "Lab notes: heat-tolerant strains, week 12", snippet: "Strain T-7 held its colour at 31 °C for six days; the control bleached on day two.", source: "Lab notes · Aquaria", date: AT - 9 * day },
  { id: "r3", kind: "Person", title: "Dr Ana Kealoha", snippet: "Leads the coral resilience programme; author of the bleaching survey reports since 2022.", source: "People", meta: ["Reef ecology"] },
  { id: "r4", kind: "Email", title: "Re: bleaching alert threshold for the buoy network", snippet: "Let's move the alert to 1.5 degree heating weeks so the field team hears sooner.", source: "Field team inbox", date: AT - day },
  { id: "r5", kind: "Document", title: "Grant final report: restoring bleached reefs with nursery fragments", snippet: "Nursery fragments survived at 71%, and transplanted colonies showed less bleaching the next summer.", source: "Grant reports", date: AT - 40 * day },
  { id: "r6", kind: "Document", title: "Water temperature log, lagoon sites", snippet: "Daily maxima above 30 °C for 18 days in March, the longest run since the logs began.", source: "Data archive", date: AT - 20 * day },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ResultsList } = ui;
  const [query, setQuery] = useState("coral bleaching");
  const typo = query === "corral bleeching";
  return (
    <div style={{ width: "100%", maxWidth: 640, display: "grid", gap: 10 }}>
      <ResultsList query={query} results={typo ? [] : RESULTS} suggestion={typo ? "coral bleaching" : undefined} pageSize={5} locale="en-GB" onSuggestion={setQuery} onOpenResult={(_, e) => e.preventDefault()} />
      <div style={{ ...caption, textAlign: "center" }}>
        Sort by date, use ↑ ↓ on the titles, or{" "}
        <button type="button" style={{ all: "unset", cursor: "pointer", textDecoration: "underline" }} onClick={() => setQuery(typo ? "coral bleaching" : "corral bleeching")}>
          {typo ? "fix the typo" : "search with a typo"}
        </button>
        .
      </div>
    </div>
  );
}
