import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { HandoffBriefAccess, HandoffBriefItem, HandoffBriefPerson, HandoffBriefRun, HandoffBriefSection } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* Ana is moving teams and hands the supplier review to Sam. Sam can't open the Northwind contract one of the open
   items depends on, so the handoff starts blocked. Request access: it's sent, and a few seconds later it's granted
   and the block lifts. Acknowledge each section, then accept.
   "Hand on a run" switches to the sender's side: Ana's ledger reconciliation is still running, and she hands it to a
   teammate – it pauses until they accept. */

const UNRESOLVED: HandoffBriefItem[] = [
  { id: "u1", text: "Confirm Northwind's Q3 capacity", detail: "Their ops lead promised numbers by Thursday", meta: "Due Thu" },
  { id: "u2", text: "Check the penalty clause before renewal", detail: "Clause 9 in the supplier contract" },
  { id: "u3", text: "Two depot claims still unverified", detail: "Flagged in the brief, claims 14 and 21" },
];

const COMMITMENTS: HandoffBriefItem[] = [
  { id: "c1", text: "Send the risk summary to Procurement", meta: "Fri 24 Oct" },
  { id: "c2", text: "Join the renewal call with Northwind", meta: "Tue 28 Oct" },
];

const RUN: HandoffBriefRun = {
  id: "recon-q3",
  title: "Reconcile the Q3 ledger",
  status: "running",
  step: "Matching 1,204 invoices to payments (step 3 of 5)",
  startedAt: Date.UTC(2026, 9, 23, 14, 2),
  owner: "Ana Ruiz",
};
const PEOPLE: HandoffBriefPerson[] = [
  { id: "sam", name: "Sam Patel", role: "Audit analyst" },
  { id: "priya", name: "Priya Shah", role: "Finance lead" },
  { id: "tom", name: "Tom Becker", role: "Controls" },
];

const MISSING: HandoffBriefAccess[] = [{ id: "contract", label: "Northwind supplier contract (v3)", where: "Unresolved item 2" }];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { HandoffBrief } = ui;
  const [run, setRun] = useState(0);
  const [missing, setMissing] = useState(MISSING);
  const [requested, setRequested] = useState(false);
  const [acknowledged, setAcknowledged] = useState<HandoffBriefSection[]>([]);
  const [accepted, setAccepted] = useState(false);
  const [mode, setMode] = useState<"receive" | "run">("receive");
  const [handedTo, setHandedTo] = useState("");

  // The access request is approved a little while after it's sent
  useEffect(() => {
    if (!requested || !missing.length) return;
    const t = setTimeout(() => setMissing([]), 2500);
    return () => clearTimeout(t);
  }, [requested, missing.length]);

  const reset = () => {
    setMissing(MISSING);
    setRequested(false);
    setAcknowledged([]);
    setAccepted(false);
    setHandedTo("");
    setRun((n) => n + 1);
  };

  if (mode === "run") {
    return (
      <div style={{ width: "100%", maxWidth: 520, display: "grid", gap: 10 }}>
        <HandoffBrief
          key={`run-${run}`}
          title="Hand on a running task"
          from={{ name: "Ana Ruiz" }}
          at="Today 16:40"
          run={RUN}
          people={PEOPLE}
          locale="en-GB"
          summary="The reconciliation has matched about 60% of invoices. Two vendors have duplicate invoice numbers – it will stop and ask about them."
          unresolved={UNRESOLVED.slice(0, 1)}
          onHandoff={(h) => setHandedTo(h.to.name)}
          onHandoffCancel={() => setHandedTo("")}
        />
        <p style={{ ...caption, margin: 0, textAlign: "center" }}>
          {handedTo ? `Waiting for ${handedTo}.` : "Choose who takes the run, then Hand off."}{" "}
          <button type="button" style={textButton} onClick={() => (reset(), setMode("receive"))}>
            Back to the receiver's view
          </button>
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", maxWidth: 520, display: "grid", gap: 10 }}>
      <HandoffBrief
        key={run}
        title="Q3 supplier review"
        from={{ name: "Ana Ruiz" }}
        to={{ name: "Sam Patel" }}
        at="Today 16:40"
        summary="The review is two-thirds done. Northwind is the only supplier still at risk: volume is fine, but their capacity figures are a year old and the renewal is due in November."
        unresolved={UNRESOLVED}
        commitments={COMMITMENTS}
        missing={missing}
        requestAccess={(_items, signal) =>
          new Promise<void>((resolve) => {
            const t = setTimeout(() => {
              setRequested(true);
              resolve();
            }, 900);
            signal.addEventListener("abort", () => clearTimeout(t));
          })
        }
        acknowledged={acknowledged}
        onAcknowledgedChange={setAcknowledged}
        accepted={accepted}
        onAccept={() => setAccepted(true)}
      />
      <p style={{ ...caption, margin: 0, textAlign: "center" }}>
        {accepted
          ? "Sam owns the review now."
          : missing.length
            ? requested
              ? "Access requested – waiting for the contract's owner."
              : "Sam can't open the contract yet."
            : `${acknowledged.length} of 3 sections acknowledged.`}{" "}
        <button type="button" style={textButton} onClick={reset}>
          Start over
        </button>{" "}
        <button type="button" style={textButton} onClick={() => (reset(), setMode("run"))}>
          Hand on a run
        </button>
      </p>
    </div>
  );
}
