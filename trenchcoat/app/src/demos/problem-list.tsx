import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ProblemItem } from "../../../src/elements/react";
import { problemKey } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's sample tracker, after a type check and a lint. */

const PROBLEMS: ProblemItem[] = [
  { path: "src/lib/freezer.ts", line: 4, column: 22, severity: "error", message: "Property 'freezer' does not exist on type 'Reading'. Did you mean 'freezerId'?", source: "ts", code: "TS2551", fix: "Change to 'freezerId'" },
  { path: "src/lib/freezer.ts", line: 3, column: 50, severity: "error", message: "Cannot find name 'Reading'.", source: "ts", code: "TS2304", fix: "Import 'Reading'" },
  { path: "src/lib/freezer.ts", line: 1, column: 46, severity: "info", message: "'setPoint' is declared but never read.", source: "ts", code: "TS6133" },
  { path: "src/lib/alerts/gaps.ts", line: 1, column: 10, severity: "warning", message: "'freezerTemperature' is defined but never used.", source: "eslint", code: "no-unused-vars", fix: "Remove the import" },
  { path: "src/routes/freezers/+page.svelte", line: 6, column: 39, severity: "warning", message: "Each block should have a key.", source: "svelte", code: "a11y-missing-key" },
  { path: "tests/freezer.test.ts", line: 2, column: 76, severity: "error", message: "Cannot find name 'f'.", source: "ts", code: "TS2304" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ProblemList } = ui;
  const [problems, setProblems] = useState(PROBLEMS);
  const [note, setNote] = useState("");
  return (
    <div style={{ width: "100%", maxWidth: 420, display: "grid", gap: 8 }}>
      <ProblemList
        description="tsc · eslint · svelte-check"
        problems={problems}
        defaultSelected={problemKey(PROBLEMS[0])}
        maxHeight={400}
        onTcOpen={(e) => setNote(`Open ${e.detail.path} at ${e.detail.line}:${e.detail.column ?? 1}.`)}
        onTcFix={(e) => {
          setProblems((list) => list.filter((p) => p !== e.detail.problem));
          setNote(`Applied “${e.detail.problem.fix}”.`);
        }}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {note || "Filter by severity or text, open a problem, or apply a fix."}{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setProblems(problems.length ? [] : PROBLEMS);
            setNote("");
          }}
        >
          {problems.length ? "Fix everything" : "Check again"}
        </button>
      </div>
    </div>
  );
}
