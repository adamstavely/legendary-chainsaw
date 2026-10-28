import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { SearchHistoryEntry } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* A case analyst's searches over the last week in a fictional file workspace. The demo's clock is fixed, so the times
   read the same every visit. */

const NOW = new Date(2026, 9, 28, 15, 0).getTime();
const MIN = 60_000;
const at = (d: number, h: number, m: number) => new Date(2026, 9, d, h, m).getTime();

const SEARCHES: SearchHistoryEntry[] = [
  { id: "s1", query: "invoice 7741", scopes: ["Files"], results: 12, at: NOW - 4 * MIN },
  { id: "s2", query: "Who approved the Q3 logistics budget?", scopes: ["AI mode"], results: 1, at: NOW - 52 * MIN, saved: true },
  { id: "s3", query: "Type is Document AND Owner is K. Osei", scopes: ["Files", "Builder"], results: 38, at: NOW - 3 * 60 * MIN },
  { id: "s4", query: "Helios Holdings", scopes: ["Entities"], results: 48, at: at(27, 16, 40) },
  { id: "s5", query: "wire transfer May", scopes: ["Files", "Contents"], results: 7, at: at(27, 10, 5), saved: true },
  { id: "s6", query: "Gennevilliers warehouse lease", scopes: ["Files"], results: 3, at: at(24, 9, 30) },
  { id: "s7", query: "board minutes 2026", scopes: ["Files"], results: 0, at: at(22, 14, 15) },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SearchHistory } = ui;
  const [last, setLast] = useState<string | null>(null);
  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 8 }}>
      <SearchHistory now={NOW} defaultSearches={SEARCHES} schedulable onRunAgain={(s) => setLast(`Running “${s.query}” again.`)} onSchedule={(s) => setLast(`Scheduling “${s.query}” – open a routine form here.`)} />
      <div style={{ ...caption, textAlign: "center" }}>{last ?? "Star a search to keep it, schedule a saved one, remove one and Undo, or move with the arrow keys."}</div>
    </div>
  );
}
