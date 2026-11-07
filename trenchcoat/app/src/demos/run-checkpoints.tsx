import { useEffect, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { RunCheckpoint, RunCheckpointBranch, RunCheckpointsStatus } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A live run that "fixed" a failing test by loosening it. Step 4 is picked: the card shows what its checkpoint holds
   and what going back throws away. Add a note and press "Go back to step 4" – the run branches out of that
   checkpoint and tries again, this time fixing the rounding instead; the attempt it left stays, faded, under
   Attempts, and picking it lists its steps again. */

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

/** What happens next, in order: [after ms, change to the newest attempt's steps at run time `now`] */
type Beat = [number, (list: RunCheckpoint[], now: number) => { list: RunCheckpoint[]; status?: RunCheckpointsStatus }];

const finish = (list: RunCheckpoint[]) => list.map((c) => (c.status === "active" ? { ...c, status: "done" as const, detail: c.detail ?? (c.tool === "run_tests" ? "All 212 tests passed" : undefined) } : c));

const FIRST_RUN: Beat[] = [
  [1800, (l, now) => ({ list: [...finish(l), { id: "s7", title: "Open a pull request", tool: "create_pr", at: now, status: "active", tokens: 1800, cost: 0.01 }] })],
  [1800, (l) => ({ list: finish(l), status: "done" })],
];

const RETRY: Beat[] = [
  [1400, (l, now) => ({ list: [...finish(l), { id: "r5", title: "Round totals half-up in cents", detail: "Quantize once, at the invoice level", tool: "edit_files", at: now, status: "active", files: ["billing/invoice.py"], tokens: 6900, cost: 0.04 }] })],
  [1400, (l, now) => ({ list: [...finish(l), { id: "r6", title: "Run the test suite again", tool: "run_tests", at: now, status: "active", tokens: 2200, cost: 0.01 }] })],
  [1400, (l, now) => ({ list: [...finish(l), { id: "r7", title: "Open a pull request", tool: "create_pr", at: now, status: "active", tokens: 1800, cost: 0.01 }] })],
  [1400, (l) => ({ list: finish(l), status: "done" })],
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { RunCheckpoints } = ui;
  const [checkpoints, setCheckpoints] = useState(BEFORE);
  const [branches, setBranches] = useState<RunCheckpointBranch[]>([]);
  const [status, setStatus] = useState<RunCheckpointsStatus>("running");
  const [elapsed, setElapsed] = useState(70_000);
  const [selected, setSelected] = useState<string | null>("s4");
  const [beats, setBeats] = useState<Beat[]>(FIRST_RUN);
  const [last, setLast] = useState("");
  // The newest attempt's own steps – what the next beat changes
  const current = branches.length ? branches[branches.length - 1].checkpoints : checkpoints;
  const listRef = useRef(current);
  listRef.current = current;
  const elapsedRef = useRef(elapsed);
  elapsedRef.current = elapsed;
  const setCurrent = (list: RunCheckpoint[]) =>
    branches.length ? setBranches((b) => [...b.slice(0, -1), { ...b[b.length - 1], checkpoints: list }]) : setCheckpoints(list);

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
      const next = apply(listRef.current, elapsedRef.current);
      setCurrent(next.list);
      if (next.status) setStatus(next.status);
      setBeats((b) => b.slice(1));
    }, wait);
    return () => clearTimeout(t);
    // setCurrent follows the attempts it was made with
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, beats]);

  const replay = () => {
    setCheckpoints(BEFORE);
    setBranches([]);
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
        branches={branches}
        status={status}
        elapsed={elapsed}
        selected={selected}
        onSelectedChange={setSelected}
        onRestore={(id, note, discarded) =>
          // Rewinding takes a moment: the workspace and the conversation are put back
          new Promise<void>((resolve) =>
            setTimeout(() => {
              // The run branches out of the checkpoint: a new attempt runs that step again, the old one stays
              const at = [...checkpoints, ...branches.flatMap((b) => b.checkpoints)].find((c) => c.id === id)!;
              const n = branches.length + 2;
              const finished = listRef.current.map((c) => (c.status === "active" ? { ...c, status: "done" as const } : c));
              setBranches((b) => [
                ...(b.length ? [...b.slice(0, -1), { ...b[b.length - 1], checkpoints: finished }] : []),
                { id: `try${n}`, from: id, label: note ? "With your note" : `Attempt ${n}`, checkpoints: [{ ...at, id: `${at.id}-${n}`, at: elapsedRef.current, status: "active", detail: note || "Same step, fresh attempt", files: undefined }] },
              ]);
              if (!branches.length) setCheckpoints(finished);
              setStatus("running");
              setBeats(RETRY);
              setLast(`Went back to “${at.title}” – ${discarded.length} steps left on the earlier attempt${note ? `, note: “${note}”` : ""}.`);
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
