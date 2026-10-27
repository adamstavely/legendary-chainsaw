import { useEffect, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { DataHandlingPolicyValue, DataPolicyDeletion, DataPolicyLock, DataPolicyOption } from "../../../src/elements/react";
import { DATA_POLICY_RETENTION } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A workspace admin's data settings. The organization caps retention at 90 days, keeps health information redacted
   and has turned training use off, so those can't be changed here. Retention was just shortened to 30 days and the
   platform catches up a moment later; any change you make does the same. Request deletion adds a request that moves
   from received to completed. */

const RETENTION: DataPolicyOption[] = DATA_POLICY_RETENTION.map((o) => (o.id === "1y" || o.id === "forever" ? { ...o, unavailable: "Your organization keeps conversations for at most 90 days." } : o));
const LOCKS: DataPolicyLock[] = [
  { field: "training", by: "Northwind IT", note: "Turned off for every workspace under the data processing agreement." },
  { field: "redact", category: "health", by: "Northwind IT" },
];
const START: DataHandlingPolicyValue = { retention: "30d", memory: "persistent", logging: "content", redact: ["personal", "financial", "credentials", "health"], training: false };
const APPLIED: DataHandlingPolicyValue = { ...START, retention: "90d" };
const DELETIONS: DataPolicyDeletion[] = [{ id: "d-1", label: "Logs", state: "completed", detail: "Requested 12 Oct by Priya Shah · finished 13 Oct" }];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { DataHandlingPolicy } = ui;
  const [value, setValue] = useState(START);
  const [effective, setEffective] = useState(APPLIED);
  const [deletions, setDeletions] = useState(DELETIONS);
  const [note, setNote] = useState("Retention was shortened to 30 days – the platform hasn't applied it yet.");
  const timers = useRef<number[]>([]);
  const later = (ms: number, fn: () => void) => void timers.current.push(window.setTimeout(fn, ms));
  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  const apply = (next: DataHandlingPolicyValue, ms: number) =>
    later(ms, () => {
      setEffective(next);
      setNote("The platform applied the policy.");
    });

  const start = () => {
    clear();
    setValue(START);
    setEffective(APPLIED);
    setDeletions(DELETIONS);
    setNote("Retention was shortened to 30 days – the platform hasn't applied it yet.");
    apply(START, 3000);
  };
  useEffect(() => {
    start();
    return clear;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount
  }, []);

  const step = (id: string, state: DataPolicyDeletion["state"], detail: string) => setDeletions((list) => list.map((d) => (d.id === id ? { ...d, state, detail } : d)));

  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 8 }}>
      <DataHandlingPolicy
        description="Support workspace · applies to every assistant in it"
        value={value}
        effective={effective}
        locks={LOCKS}
        retentionOptions={RETENTION}
        deletions={deletions}
        name="policy"
        onChange={(next, field) => {
          setValue(next);
          setNote(`Saved your ${field === "redact" ? "redaction" : field} change – waiting for the platform to apply it.`);
          apply(next, 1800);
        }}
        onDeletionRequest={(scope) => {
          const id = `d-${scope.id}-${deletions.length + 1}`;
          setNote(`Requested deletion of ${scope.label.toLowerCase()}.`);
          later(900, () => setDeletions((list) => [{ id, label: scope.label, state: "received", detail: "Requested just now by you" }, ...list]));
          later(3200, () => step(id, "in-progress", "Requested just now by you · deleting"));
          later(6200, () => step(id, "completed", "Requested just now by you · finished"));
        }}
      />
      <div style={{ ...caption, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <span>{note}</span>
        <button type="button" style={textButton} onClick={start}>
          Reset
        </button>
      </div>
    </div>
  );
}
