import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { TestCase } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* The test suite of a fictional research institute's "audit-ledger" package: two failures, the rest passed. Re-run
   failed runs them again – the page owns the data, so it counts up live and this time one of them passes. */

const STACK = `AssertionError: expected 1240 to be 1214.5
    at Object.<anonymous> (src/ledger.test.ts:42:18)
    at post (src/ledger.ts:88:11)
    at node_modules/vitest/dist/runner.js:120:9
    at node:internal/process/task_queues:95:5`;

const FAILED: TestCase[] = [
  {
    id: "totals",
    suite: "ledger › totals",
    name: "sums postings in the reporting currency",
    status: "failed",
    durationMs: 18,
    message: "expected 1240 to be 1214.5",
    expected: "1214.5",
    received: "1240",
    stack: STACK,
  },
  {
    id: "rounding",
    suite: "ledger › rounding",
    name: "rounds half-cents to even",
    status: "failed",
    durationMs: 6,
    message: "Objects differ",
    expected: '{\n  "amount": 10.02,\n  "currency": "EUR"\n}',
    received: '{\n  "amount": 10.03,\n  "currency": "EUR"\n}',
    stack: `AssertionError: Objects differ\n    at Object.<anonymous> (src/rounding.test.ts:17:22)\n    at node_modules/vitest/dist/runner.js:120:9`,
  },
];
const PASSED: TestCase[] = ["opens a period", "closes a period", "rejects a negative amount", "keeps an audit trail of edits"].map((name, i) => ({
  id: `p${i}`,
  suite: "ledger › periods",
  name,
  status: "passed",
  durationMs: 4 + i * 3,
}));

export default function Demo({ ui }: { ui: typeof UI }) {
  const { TestRunResult } = ui;
  const [tests, setTests] = useState<TestCase[]>([...FAILED, ...PASSED]);
  const [running, setRunning] = useState(false);
  const [file, setFile] = useState("");

  // A re-run: the two failures run again, one at a time; the rounding one now passes
  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => {
      setTests([FAILED[0], { ...FAILED[1], status: "passed", message: undefined, expected: undefined, received: undefined, stack: undefined }, ...PASSED]);
      setRunning(false);
    }, 900);
    return () => clearTimeout(t);
  }, [running]);

  return (
    <div style={{ width: "100%", maxWidth: 720, display: "grid", gap: 8 }}>
      <TestRunResult
        title="audit-ledger"
        command="npx vitest run"
        tests={tests}
        counts={{ passed: 212, skipped: 4 }}
        total={218}
        duration={12400}
        running={running}
        onRerun={() => void setRunning(true)}
        onOpenFile={(f, line) => setFile(`${f}:${line}`)}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {file ? `Opened ${file}. ` : "Open a failure's file, or re-run the failures. "}
        <button type="button" style={textButton} onClick={() => setTests([...FAILED, ...PASSED])}>
          Start again
        </button>
      </div>
    </div>
  );
}
