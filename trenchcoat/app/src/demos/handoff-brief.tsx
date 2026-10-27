import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { HandoffBriefAccess, HandoffBriefItem, HandoffBriefSection } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* Ana is moving teams and hands the supplier review to Sam. Sam can't open the Northwind contract one of the open
   items depends on, so the handoff starts blocked. Request access: it's sent, and a few seconds later it's granted
   and the block lifts. Acknowledge each section, then accept. */

const UNRESOLVED: HandoffBriefItem[] = [
  { id: "u1", text: "Confirm Northwind's Q3 capacity", detail: "Their ops lead promised numbers by Thursday", meta: "Due Thu" },
  { id: "u2", text: "Check the penalty clause before renewal", detail: "Clause 9 in the supplier contract" },
  { id: "u3", text: "Two depot claims still unverified", detail: "Flagged in the brief, claims 14 and 21" },
];

const COMMITMENTS: HandoffBriefItem[] = [
  { id: "c1", text: "Send the risk summary to Procurement", meta: "Fri 24 Oct" },
  { id: "c2", text: "Join the renewal call with Northwind", meta: "Tue 28 Oct" },
];

const MISSING: HandoffBriefAccess[] = [{ id: "contract", label: "Northwind supplier contract (v3)", where: "Unresolved item 2" }];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { HandoffBrief } = ui;
  const [run, setRun] = useState(0);
  const [missing, setMissing] = useState(MISSING);
  const [requested, setRequested] = useState(false);
  const [acknowledged, setAcknowledged] = useState<HandoffBriefSection[]>([]);
  const [accepted, setAccepted] = useState(false);

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
    setRun((n) => n + 1);
  };

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
        </button>
      </p>
    </div>
  );
}
