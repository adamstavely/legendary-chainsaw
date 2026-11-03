import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { BranchItem } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* The branches of a research institute's sample tracker. Pick one, or type a new name to create it from main; the page
   adds it to the list. */

const NOW = Date.UTC(2026, 10, 2, 15, 0);
const H = 3_600_000;
const START: BranchItem[] = [
  { name: "feature/booking-calendar", kind: "worktree", path: "~/work/booking-calendar", ahead: 4, behind: 2, updated: NOW - 0.3 * H, dirty: true },
  { name: "fix/sample-export", kind: "worktree", path: "~/work/sample-export", ahead: 1, updated: NOW - 5 * H },
  { name: "main", kind: "local", updated: NOW - 2 * H },
  { name: "feature/freezer-map", kind: "local", ahead: 7, behind: 12, updated: NOW - 50 * H },
  { name: "chore/upgrade-charts", kind: "local", ahead: 2, behind: 30, updated: NOW - 9 * 24 * H },
  { name: "origin/main", kind: "remote", updated: NOW - 2 * H },
  { name: "origin/release/2.4", kind: "remote", behind: 18, updated: NOW - 6 * 24 * H },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { BranchSwitcher } = ui;
  const [branches, setBranches] = useState(START);
  const [current, setCurrent] = useState("feature/booking-calendar");
  const create = (name: string) => {
    setBranches((b) => [...b, { name, kind: "local", updated: NOW }]);
    setCurrent(name);
  };
  return (
    <div style={{ width: "100%", maxWidth: 400, display: "grid", gap: 12 }}>
      <BranchSwitcher title="" branches={branches} current={current} onCurrentChange={setCurrent} base="main" now={NOW} onTcCreate={(e) => create(e.detail.name)} />
      <BranchSwitcher title="Switch branch" inline branches={branches} current={current} onCurrentChange={setCurrent} base="main" now={NOW} onTcCreate={(e) => create(e.detail.name)} />
      <div style={{ ...caption, textAlign: "center" }}>
        Type a new name to create a branch.{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setBranches(START);
            setCurrent("feature/booking-calendar");
          }}
        >
          Start again
        </button>
      </div>
    </div>
  );
}
