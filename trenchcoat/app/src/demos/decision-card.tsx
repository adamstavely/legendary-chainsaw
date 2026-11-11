import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { DecisionCardKind, DecisionCardMade, DecisionCardOption } from "../../../src/elements/react";
import { bubble, caption, textButton } from "../demo-kit";

/** A fixed clock, so the waited-for times and the thumbnail stay the same */
const NOW = Date.UTC(2026, 10, 10, 9, 30);
const MIN = 60_000;

type Waiting = { agent: string; question: string; context?: string; kind: DecisionCardKind; options?: DecisionCardOption[]; allowOther?: boolean; since: number };

const QUEUE: Waiting[] = [
  {
    agent: "Records agent",
    question: "Two vendor files describe the same supplier. Which one should I keep?",
    context: "Northwind Paper appears as V-2210 (2019) and V-3184 (2024). They share a tax ID but list different bank details.",
    kind: "choose",
    allowOther: true,
    since: NOW - 4 * MIN,
    options: [
      { id: "newer", label: "Keep V-3184, archive V-2210", detail: "The 2024 file has the signed bank letter", recommended: true },
      { id: "older", label: "Keep V-2210, archive V-3184", detail: "Payments since 2019 point at it" },
      { id: "both", label: "Keep both and flag for review", detail: "Nothing changes until someone checks" },
    ],
  },
  {
    agent: "Report agent",
    question: "Publish the draft audit summary to the review folder?",
    context: "12 pages, 3 open findings. Reviewers get a notification.",
    kind: "approve",
    since: NOW - 18 * MIN,
  },
  {
    agent: "Classification agent",
    question: "How should I label the 40 scanned contracts with no date?",
    kind: "choose",
    since: NOW - 52 * MIN,
    options: [
      { id: "undated", label: "Mark them Undated" },
      { id: "scan", label: "Use the scan date", recommended: true },
      { id: "skip", label: "Leave them unlabelled" },
    ],
  },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { DecisionCard } = ui;
  const [position, setPosition] = useState(0);
  const [values, setValues] = useState<Record<number, string | null>>({});
  const [sent, setSent] = useState<Record<number, boolean>>({});
  const [last, setLast] = useState<DecisionCardMade | null>(null);
  const d = QUEUE[position];

  return (
    <div style={{ width: "100%", maxWidth: 520, display: "grid", gap: 12 }}>
      <div style={{ ...bubble, justifySelf: "end", maxWidth: "80%", padding: "8px 12px", borderRadius: 14, fontSize: 13, lineHeight: 1.45 }}>
        Clean up the vendor register before Friday's audit.
      </div>
      <DecisionCard
        agent={d.agent}
        question={d.question}
        context={d.context}
        kind={d.kind}
        options={d.options ?? []}
        allowOther={!!d.allowOther}
        since={d.since}
        now={NOW}
        queue={QUEUE.length}
        position={position}
        onPositionChange={setPosition}
        value={values[position] ?? null}
        onValueChange={(v) => setValues((s) => ({ ...s, [position]: v }))}
        sent={!!sent[position]}
        onDecision={(decision) => {
          setLast(decision);
          setSent((s) => ({ ...s, [position]: true }));
        }}
        onUndo={() => setSent((s) => ({ ...s, [position]: false }))}
      />
      <div style={{ ...caption, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <span>{last ? `Sent: ${last.choice}${last.other ? ` – ${last.other}` : ""}${last.reason ? ` – ${last.reason}` : ""}` : "1–3 pick · ⌘ Enter sends · Esc decides later"}</span>
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setValues({});
            setSent({});
            setLast(null);
            setPosition(0);
          }}
        >
          Start over
        </button>
      </div>
    </div>
  );
}
