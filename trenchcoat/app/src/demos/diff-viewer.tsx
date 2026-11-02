import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { DiffFile } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* The changes on a branch of a research institute's sample tracker. */

const SAMPLE_CHANGES: DiffFile[] = [
  {
    path: "src/alerts/gaps.ts",
    before: 'export function findGaps(log: Reading[]) {\n  const gaps = [];\n  for (let i = 1; i < log.length; i++) {\n    if (log[i].at - log[i - 1].at > HOUR) gaps.push(log[i]);\n  }\n  return gaps;\n}\n',
    after: 'export function findGaps(log: Reading[], limit = HOUR) {\n  const gaps: Gap[] = [];\n  for (let i = 1; i < log.length; i++) {\n    const missing = log[i].at - log[i - 1].at;\n    if (missing > limit) gaps.push({ from: log[i - 1].at, missing });\n  }\n  return gaps;\n}\n',
  },
  { path: "tests/gaps.test.ts", after: 'import { findGaps } from "../src/alerts/gaps";\n\ntest("finds a two-hour gap", () => {\n  expect(findGaps(LOG)).toHaveLength(1);\n});\n' },
  { path: "src/alerts/legacy.ts", before: "export const OLD_LIMIT = 3600;\n" },
  { path: "docs/freezer-map.png", binary: true },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { DiffViewer } = ui;
  const [round, setRound] = useState(0);
  return (
    <div style={{ width: "100%", maxWidth: 680, display: "grid", gap: 8 }}>
      <DiffViewer key={round} description="cold-chain-alerts, compared with main" files={SAMPLE_CHANGES} defaultExpanded={[SAMPLE_CHANGES[0].path]} />
      <div style={{ ...caption, textAlign: "center" }}>
        Open a file to see its diff.{" "}
        <button type="button" style={textButton} onClick={() => setRound(round + 1)}>
          Start again
        </button>
      </div>
    </div>
  );
}
