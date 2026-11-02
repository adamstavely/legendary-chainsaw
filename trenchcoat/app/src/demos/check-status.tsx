import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { CheckItem } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* The checks on a fictional change to a research institute's sample tracker: one failing, one still going. Re-run marks
   the failing one as pending, because the page owns the data. */

const START: CheckItem[] = [
  { id: "unit", name: "Unit tests", state: "failing", detail: "2 of 480 failed in the freezer inventory", durationMs: 184000 },
  { id: "browser", name: "Browser tests", state: "pending" },
  { id: "types", name: "Type check", state: "passing", durationMs: 42000 },
  { id: "lint", name: "Lint", state: "passing", durationMs: 19000 },
  { id: "build", name: "Build", state: "passing", durationMs: 96000 },
  { id: "docs", name: "Docs preview", state: "skipped" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { CheckStatus, countChecks } = ui;
  const [checks, setChecks] = useState(START);
  return (
    <div style={{ width: "100%", maxWidth: 520, display: "grid", gap: 8 }}>
      <CheckStatus
        title="Checks"
        description="Add freezer locations to the sample index"
        checks={checks}
        retryable
        onTcRetry={(e) => setChecks(checks.map((c) => (c.id === e.detail.id ? { id: c.id, name: c.name, state: "pending" } : c)))}
      />
      <div style={{ ...caption, textAlign: "center", display: "flex", gap: 8, justifyContent: "center", alignItems: "center" }}>
        In a list row: <CheckStatus compact counts={countChecks(checks)} />
        <button type="button" style={textButton} onClick={() => setChecks(START)}>
          Start again
        </button>
      </div>
    </div>
  );
}
