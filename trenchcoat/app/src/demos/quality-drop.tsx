import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { QualityDropEvidence, QualityDropPoint, QualityDropStatus } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* The research institute's "Policy Q&A" agent: correctness fell the day prompt v14 went live. The demo starts open;
   roll back, dismiss, or open a quote. */

const DAY = 86_400_000;
const AT = Date.UTC(2026, 10, 3);

/** A small deterministic noise, so the demo looks the same every time */
const noise = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

const SERIES: QualityDropPoint[] = Array.from({ length: 21 }, (_, i) => {
  const date = AT - 13 * DAY + i * DAY;
  return { date, value: (date >= AT ? 3.8 : 4.42) + (noise(i + 11) - 0.5) * 0.16 };
});

const EVIDENCE: QualityDropEvidence[] = [
  { id: "chat-4821", quote: "You can claim up to £60 a night for hotels on any trip.", note: "The limit is £120 in London; no policy cited" },
  { id: "chat-4907", quote: "Receipts aren't needed for expenses under £50.", note: "The threshold is £25 – answer contradicts section 4.2" },
  { id: "chat-5013", quote: "Annual leave carries over automatically.", note: "Carry-over needs a manager's approval; no citation" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { QualityDrop } = ui;
  const [status, setStatus] = useState<QualityDropStatus>("open");
  const [note, setNote] = useState("");
  return (
    <div style={{ width: "100%", maxWidth: 680, display: "grid", gap: 10 }}>
      <QualityDrop
        title="Policy Q&A · quality drop"
        criterion="Correctness"
        from={4.4}
        to={3.8}
        at={AT}
        chats={1284}
        series={SERIES}
        cause={{
          change: { label: "Prompt v13 → v14", at: AT, kind: "prompt" },
          confidence: "high",
          reason: "Went live the day scores fell; failing answers skip the handbook citation v14 moved to the end of the prompt.",
        }}
        evidence={EVIDENCE}
        segments={[
          { id: "travel", label: "Travel & expenses", share: 0.46 },
          { id: "leave", label: "Leave", share: 0.27 },
          { id: "it", label: "IT equipment", share: 0.15 },
          { id: "other", label: "Other", share: 0.12 },
        ]}
        rollbackTo="v13"
        reverts={["The instructions go back to v13", "The policy-search tool and Atlas 3 stay as they are", "Chats already answered keep their answers"]}
        status={status}
        onStatusChange={setStatus}
        onInvestigate={() => setNote("Investigate: the page would open the failing chats.")}
        onChatOpen={(id) => setNote(`Opened ${id}.`)}
        locale="en-GB"
      />
      <div style={{ ...caption, textAlign: "center", minHeight: 18 }}>
        {note || "Roll back asks first and says what reverts. "}
        {status !== "open" && (
          <button type="button" style={textButton} onClick={() => setStatus("open")}>
            Start over
          </button>
        )}
      </div>
    </div>
  );
}
