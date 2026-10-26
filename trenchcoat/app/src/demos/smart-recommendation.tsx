import { useState } from "react";
import type * as UI from "@components/smart-recommendation";
import type { Recommendation } from "@components/smart-recommendation";

const options: Recommendation[] = [
  {
    id: "incremental",
    label: "Incremental sync",
    reason: (
      <>
        Only <b>3%</b> of your 1.2M rows changed last week – syncing just the changes cuts run time from 42 min to about 2.
      </>
    ),
    signal: 3,
  },
  {
    id: "nightly",
    label: "Nightly full sync",
    reason: "Simplest to reason about, but each run reloads every row and blocks the warehouse for ~40 minutes.",
    signal: 2,
  },
  {
    id: "stream",
    label: "Change streaming",
    reason: "Near real-time, but your source database doesn't have logical replication enabled yet.",
    signal: 1,
  },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SmartRecommendation } = ui;
  const [status, setStatus] = useState("Nothing applied yet");
  return (
    <div style={{ width: "100%", maxWidth: 440, display: "grid", gap: 10 }}>
      <SmartRecommendation
        title="Recommended"
        options={options}
        defaultOpen
        onAccept={(o) => setStatus(`Applied: ${o.label}`)}
        onUndo={(o) => setStatus(`Undid: ${o.label}`)}
      />
      <div style={{ fontSize: 12, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))", textAlign: "center" }}>{status}</div>
    </div>
  );
}
