import { useEffect, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { RunCheckpoint, RunCheckpointsStatus } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A live run that "fixed" a failing test by loosening it. Step 4 is picked: the card shows what its checkpoint holds
   and what going back throws away. Add a note and press "Go back to step 4" – the run rewinds and tries again,
   this time fixing the rounding instead. */

const BEFORE: RunCheckpoint[] = [
  {
    id: "s1",
    title: "Read the billing schema",
    detail: "14 tables, 3 with money columns",
    tool: "read_files",
    at: 0,
    tokens: 6200,
    cost: 0.03,
    captured: [
      { label: "Conversation", value: "2 messages" },
      { label: "Workspace", value: "Clean checkout" },
    ],
  },
  {
    id: "s2",
    title: "Write the Postgres migration",
    tool: "write_file",
    at: 9_000,
    files: ["migrations/0042_billing_postgres.sql"],
    tokens: 9800,
    cost: 0.06,
    captured: [
      { label: "Conversation", value: "5 messages" },
      { label: "Memory", value: "Schema notes" },
      { label: "Workspace", value: "Clean checkout" },
    ],
  },
  {
    id: "s3",
    title: "Update the invoice models",
    detail: "Decimal columns become numeric(12,2)",
    tool: "edit_files",
    at: 23_000,
    files: ["billing/models.py", "billing/invoice.py"],
    tokens: 12400,
    cost: 0.08,
    captured: [
      { label: "Conversation", value: "9 messages" },
      { label: "Memory", value: "Schema notes" },
      { label: "Workspace", value: "1 changed file" },
    ],
  },
  {
    id: "s4",
    title: "Run the test suite",
    detail: "3 failed: invoice totals off by a cent",
    tool: "run_tests",
    at: 41_000,
    status: "failed",
    tokens: 4100,
    cost: 0.02,
    captured: [
      { label: "Conversation", value: "14 messages" },
      { label: "Memory", value: "Schema notes" },
      { label: "Workspace", value: "3 changed files" },
    ],
  },
  {
    id: "s5",
    title: "Loosen the totals assertion",
    detail: "assertEqual → assertAlmostEqual",
    tool: "edit_files",
    at: 58_000,
    files: ["tests/test_invoice.py"],
    tokens: 5300,
    cost: 0.03,
  },
  { id: "s6", title: "Run the test suite again", tool: "run_tests", at: 66_000, status: "active", tokens: 2100, cost: 0.01 },
];

/** What happens next, in order: [after ms, change] */
type Beat = [number, (list: RunCheckpoint[]) => { list: RunCheckpoint[]; status?: RunCheckpointsStatus }];

const finish = (list: RunCheckpoint[]) => list.map((c) => (c.status === "active" ? { ...c, status: "done" as const, detail: c.detail ?? (c.tool === "run_tests" ? "All 212 tests passed" : undefined) } : c));

const FIRST_RUN: Beat[] = [
  [1800, (l) => ({ list: [...finish(l), { id: "s7", title: "Open a pull request", tool: "create_pr", at: 79_000, status: "active", tokens: 1800, cost: 0.01 }] })],
  [1800, (l) => ({ list: finish(l), status: "done" })],
];

const RETRY: Beat[] = [
  [1400, (l) => ({ list: [...finish(l), { id: "r5", title: "Round totals half-up in cents", detail: "Quantize once, at the invoice level", tool: "edit_files", at: 52_000, status: "active", files: ["billing/invoice.py"], tokens: 6900, cost: 0.04 }] })],
  [1400, (l) => ({ list: [...finish(l), { id: "r6", title: "Run the test suite again", tool: "run_tests", at: 61_000, status: "active", tokens: 2200, cost: 0.01 }] })],
  [1400, (l) => ({ list: [...finish(l), { id: "r7", title: "Open a pull request", tool: "create_pr", at: 70_000, status: "active", tokens: 1800, cost: 0.01 }] })],
  [1400, (l) => ({ list: finish(l), status: "done" })],
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { RunCheckpoints } = ui;
  const [checkpoints, setCheckpoints] = useState(BEFORE);
  const [status, setStatus] = useState<RunCheckpointsStatus>("running");
  const [elapsed, setElapsed] = useState(70_000);
  const [selected, setSelected] = useState<string | null>("s4");
  const [beats, setBeats] = useState<Beat[]>(FIRST_RUN);
  const [last, setLast] = useState("");
  const listRef = useRef(checkpoints);
  listRef.current = checkpoints;

  // The run's clock and its next step – both stop once the run is done
  useEffect(() => {
    if (status !== "running") return;
    const tick = setInterval(() => setElapsed((e) => e + 1000), 1000);
    return () => clearInterval(tick);
  }, [status]);
  useEffect(() => {
    if (status !== "running" || !beats.length) return;
    const [wait, apply] = beats[0];
    const t = setTimeout(() => {
      const next = apply(listRef.current);
      setCheckpoints(next.list);
      if (next.status) setStatus(next.status);
      setBeats((b) => b.slice(1));
    }, wait);
    return () => clearTimeout(t);
  }, [status, beats]);

  const replay = () => {
    setCheckpoints(BEFORE);
    setStatus("running");
    setElapsed(70_000);
    setSelected("s4");
    setBeats(FIRST_RUN);
    setLast("");
  };

  return (
    <div style={{ width: "100%", maxWidth: 480, display: "grid", gap: 10 }}>
      <RunCheckpoints
        title="Move billing from MySQL to Postgres"
        checkpoints={checkpoints}
        status={status}
        elapsed={elapsed}
        selected={selected}
        onSelectedChange={setSelected}
        onRestore={(id, note, discarded) =>
          // Rewinding takes a moment: the workspace and the conversation are put back
          new Promise<void>((resolve) =>
            setTimeout(() => {
              const i = listRef.current.findIndex((c) => c.id === id);
              const at = listRef.current[i];
              setCheckpoints([...listRef.current.slice(0, i), { ...at, id: `${at.id}-again`, status: "active", detail: note || "Same step, fresh attempt", files: undefined }]);
              setElapsed(at.at + 2000);
              setStatus("running");
              setBeats(RETRY);
              setLast(`Went back to step ${i + 1} – ${discarded.length} steps discarded${note ? `, note: “${note}”` : ""}.`);
              resolve();
            }, 700),
          )
        }
      />
      <p style={{ ...caption, margin: 0, textAlign: "center" }}>
        {last || "Arrow keys pick a step · Enter writes a note for the retry"}{" "}
        <button type="button" style={textButton} onClick={replay}>
          Replay
        </button>
      </p>
    </div>
  );
}
