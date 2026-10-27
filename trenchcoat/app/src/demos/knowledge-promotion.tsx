import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { KnowledgeCondition, KnowledgeFact, KnowledgeStatus, KnowledgeVersion } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A lease-review team promoting a finding into what the whole team relies on. The reviewer's sign-off arrives a beat
   after the card opens, which makes it ready – with a warning, because nobody has been a second reviewer yet. Promote
   saves for a moment, then the fact is in team knowledge. Raise a dispute instead and your version sits beside the
   original, the "No open dispute" condition opens again and Promote waits. */

const FACT: KnowledgeFact = {
  text: "The notice period for terminating the Acme master lease is 90 days, served in writing to the landlord's registered office.",
  by: "Ana Ruiz",
  at: "12 Oct",
  source: "Review of the 2019 master lease, clause 14.2",
  confidence: 0.88,
};

const SIGNOFF_PENDING: KnowledgeCondition = { id: "signoff", label: "Reviewer sign-off", met: false, detail: "Requested from Priya Shah" };
const SIGNOFF_MET: KnowledgeCondition = { id: "signoff", label: "Reviewer sign-off", met: true, by: "Priya Shah", at: "13 Oct, 09:40" };

export default function Demo({ ui }: { ui: typeof UI }) {
  const { KnowledgePromotion } = ui;
  const [signed, setSigned] = useState(false);
  const [second, setSecond] = useState(false);
  const [versions, setVersions] = useState<KnowledgeVersion[]>([]);
  const [status, setStatus] = useState<KnowledgeStatus>("candidate");
  const [log, setLog] = useState("");

  // The sign-off arrives once, a beat after the card opens
  useEffect(() => {
    if (signed) return;
    const t = setTimeout(() => setSigned(true), 1800);
    return () => clearTimeout(t);
  }, [signed]);

  // Saving takes a moment, then the fact is promoted
  useEffect(() => {
    if (status !== "promoting") return;
    const t = setTimeout(() => {
      setStatus("promoted");
      setLog("Promoted. Other matters' answers can now cite it as team knowledge.");
    }, 1200);
    return () => clearTimeout(t);
  }, [status]);

  const conditions: KnowledgeCondition[] = [
    signed ? SIGNOFF_MET : SIGNOFF_PENDING,
    versions.length
      ? { id: "dispute", label: "No open dispute", met: false, detail: `${versions.length} open – resolve it first` }
      : { id: "dispute", label: "No open dispute", met: true, detail: "Checked against the matter's disputes" },
    second ? { id: "second", label: "Second reviewer", required: false, met: true, by: "Tom Lee", at: "13 Oct, 11:05" } : { id: "second", label: "Second reviewer", required: false, met: false },
  ];

  const replay = () => {
    setSigned(false);
    setSecond(false);
    setVersions([]);
    setStatus("candidate");
    setLog("");
  };

  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 10 }}>
      <KnowledgePromotion
        scope="Acme lease review · team knowledge"
        fact={FACT}
        conditions={conditions}
        versions={versions}
        threshold={0.8}
        status={status}
        onPromote={(_fact, unmet) => {
          setStatus("promoting");
          setLog(unmet.length ? "Promoting without a second reviewer…" : "Promoting…");
        }}
        onDispute={(reason, version) => {
          setVersions((v) => [...v, { id: `v${v.length + 2}`, text: version || "(no wording proposed)", by: "You", at: "Just now", note: reason }]);
          setStatus("candidate");
          setLog("Your dispute is beside the original. Promote waits until it's resolved.");
        }}
      />
      <p style={{ ...caption, margin: 0, textAlign: "center" }}>
        {log || (signed ? "Signed off – promote it, or dispute it" : "Waiting for the reviewer's sign-off…")}{" "}
        {!second && status !== "promoted" && (
          <>
            <button type="button" style={textButton} onClick={() => setSecond(true)}>
              Add a second reviewer
            </button>{" "}
          </>
        )}
        <button type="button" style={textButton} onClick={replay}>
          Replay
        </button>
      </p>
    </div>
  );
}
