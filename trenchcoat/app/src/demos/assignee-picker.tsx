import { useState, type CSSProperties } from "react";
import type * as UI from "../../../src/elements/react";
import type { AssigneePerson, AssigneeTeam, AssigneeValue } from "../../../src/elements/assignee-picker";
import { caption, surface, textButton } from "../demo-kit";

/* The assignee of a few cases in a fictional case-review app, "Ledgerline": reviewers with their open cases against
   what they can carry, one away and one over capacity, and two teams, one taking turns. The reader is Noor Haddad,
   so Assign to me comes first. */

const PEOPLE: AssigneePerson[] = [
  { id: "noor", name: "Noor Haddad", team: "Fraud review", open: 7, capacity: 12 },
  { id: "tomas", name: "Tomas Lind", team: "Fraud review", open: 11, capacity: 12 },
  { id: "priya", name: "Priya Raman", team: "Disputes", open: 14, capacity: 10 },
  { id: "ade", name: "Ade Okafor", team: "Disputes", open: 3, capacity: 10, away: true },
  { id: "mei", name: "Mei Chen", team: "Fraud review", open: 5, capacity: 12 },
];
const TEAMS: AssigneeTeam[] = [
  { id: "fraud", name: "Fraud review", members: 3, open: 23, roundRobin: true },
  { id: "disputes", name: "Disputes", members: 2, open: 17 },
];
const CASES = [
  { id: "CS-1041", title: "Card testing on new merchant", start: { type: "person", id: "tomas" } as AssigneeValue },
  { id: "CS-1043", title: "Refund loop on one account", start: { type: "team", id: "disputes" } as AssigneeValue },
  { id: "CS-1046", title: "Chargeback on a gift card", start: null },
];

const page: CSSProperties = { ...surface, display: "grid", gap: 0, padding: "6px 16px", borderRadius: 14, width: "100%", boxSizing: "border-box" };
const row: CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "10px 0", fontSize: 13 };

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AssigneePicker } = ui;
  const [values, setValues] = useState<Record<string, AssigneeValue | null>>(Object.fromEntries(CASES.map((c) => [c.id, c.start])));
  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 10 }}>
      <div style={page}>
        {CASES.map((c, i) => (
          <div key={c.id} style={{ ...row, borderTop: i ? "1px solid var(--tc-border-default, light-dark(#ececec, #2a2a2e))" : "none" }}>
            <span style={{ display: "grid", gap: 2, minWidth: 0 }}>
              <span style={{ opacity: 0.7, fontSize: 12, fontVariantNumeric: "tabular-nums" }}>{c.id}</span>
              <span>{c.title}</span>
            </span>
            <AssigneePicker people={PEOPLE} teams={TEAMS} me="noor" value={values[c.id]} onValueChange={(v) => setValues((all) => ({ ...all, [c.id]: v }))} />
          </div>
        ))}
      </div>
      <div style={{ ...caption, textAlign: "center" }}>
        Open an assignee to search; Priya is over capacity and Ade is away.{" "}
        <button type="button" style={textButton} onClick={() => setValues(Object.fromEntries(CASES.map((c) => [c.id, c.start])))}>
          Reset
        </button>
      </div>
    </div>
  );
}
