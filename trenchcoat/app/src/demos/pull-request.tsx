import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { PullRequestMergeable, PullRequestState } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A pull request on a research institute's sample tracker. Each scenario changes what can happen next; Merge and Mark
   ready change the state, because the page owns the data. */

const NOW = Date.UTC(2026, 10, 2, 15, 0);
type Scenario = { name: string; state: PullRequestState; mergeable: PullRequestMergeable; failing: number; pending: number };
const SCENARIOS: Scenario[] = [
  { name: "Ready to merge", state: "open", mergeable: "clean", failing: 0, pending: 1 },
  { name: "Behind main", state: "open", mergeable: "behind", failing: 0, pending: 0 },
  { name: "Conflicts", state: "open", mergeable: "conflicts", failing: 0, pending: 0 },
  { name: "A failing check", state: "open", mergeable: "clean", failing: 1, pending: 0 },
  { name: "Draft", state: "draft", mergeable: "clean", failing: 0, pending: 2 },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { PullRequest } = ui;
  const [at, setAt] = useState(0);
  const [state, setState] = useState<PullRequestState>(SCENARIOS[0].state);
  const [note, setNote] = useState("");
  const s = SCENARIOS[at];
  const next = () => {
    const i = (at + 1) % SCENARIOS.length;
    setAt(i);
    setState(SCENARIOS[i].state);
    setNote("");
  };
  return (
    <div style={{ width: "100%", maxWidth: 400, display: "grid", gap: 8 }}>
      <PullRequest
        number={128}
        prTitle="Add the booking calendar to instrument pages"
        url="https://example.org/institute/sample-tracker/pull/128"
        state={state}
        head="feature/booking-calendar"
        base="main"
        author="r.okafor"
        updatedAt={NOW - 42 * 60_000}
        now={NOW}
        additions={412}
        deletions={57}
        files={9}
        review="approved"
        reviewers={[
          { name: "m.lindqvist", state: "approved" },
          { name: "s.haddad", state: "requested" },
        ]}
        checks={{ passing: 7 - s.failing - s.pending, failing: s.failing, pending: s.pending, skipped: 1 }}
        mergeable={s.mergeable}
        defaultMergeMethod="squash"
        onTcOpen={(e) => e.preventDefault()}
        onTcMerge={(e) => {
          setState("merged");
          setNote(`Merged with ${e.detail.method}`);
        }}
        onTcReady={() => setState("open")}
        onTcUpdateBranch={() => setNote("Update branch pressed")}
        onTcResolve={() => setNote("Resolve pressed")}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {note || s.name}.{" "}
        <button type="button" style={textButton} onClick={next}>
          Next scenario
        </button>
      </div>
    </div>
  );
}
