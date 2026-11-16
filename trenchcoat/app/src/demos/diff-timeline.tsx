import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { DiffTimelineFile } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fictional coding agent's pull request on an open-source calendar library: it fixes how local times in the hour the
   clocks skip are parsed. Twelve minutes of edits across five files; the times are fixed, so the card's the same on
   every visit. */

const START = Date.UTC(2026, 10, 14, 10, 0);
const at = (minutes: number) => START + Math.round(minutes * 60_000);

const FILES: DiffTimelineFile[] = [
  {
    path: "packages/core/src/parse/local.ts",
    edits: [
      { id: "l1", at: at(1.2), added: 14, removed: 6, summary: "Detect a local time inside a skipped hour", diff: " export function parseLocal(text, zone) {\n-  const offset = zone.offsetAt(naive);\n+  const offset = zone.offsetAt(naive);\n+  if (zone.isGap(naive)) return shiftForward(naive, zone);\n   return toInstant(naive, offset);" },
      { id: "l2", at: at(4.6), added: 9, removed: 2, summary: "Shift forward by the gap's length", diff: "+function shiftForward(naive, zone) {\n+  const gap = zone.gapAt(naive);\n+  return toInstant(naive.plus(gap.length), gap.after);\n+}" },
      { id: "l3", at: at(9.8), added: 3, removed: 3, summary: "Name the fold case too", diff: "-  // TODO: ambiguous times\n+  // In a fold the earlier offset wins, as before" },
    ],
  },
  {
    path: "packages/core/src/zone/gaps.ts",
    edits: [
      { id: "g1", at: at(2.9), added: 31, removed: 0, summary: "Find a zone's gaps from its transitions", diff: "+export function gapAt(zone, naive) {\n+  const t = zone.transitionBefore(naive);\n+  return t && t.after > t.before ? { length: t.after - t.before, after: t.after } : null;\n+}" },
      { id: "g2", at: at(6.1), added: 4, removed: 1, summary: "Cache transitions per year" },
    ],
  },
  {
    path: "packages/core/test/parse-dst.test.ts",
    edits: [
      { id: "t1", at: at(5.4), added: 42, removed: 0, summary: "Tests for the spring and autumn changes", diff: "+it(\"moves 02:30 to 03:30 on the spring change\", () => {\n+  expect(parseLocal(\"2026-03-29T02:30\", berlin)).toEqual(at(\"03:30+02:00\"));\n+});" },
      { id: "t2", at: at(8.2), added: 12, removed: 0, summary: "Southern-hemisphere zones" },
      { id: "t3", at: at(10.9), added: 2, removed: 2, summary: "Fix a test's expected offset" },
    ],
  },
  {
    path: "packages/core/src/zone/zone.ts",
    edits: [{ id: "z1", at: at(3.4), added: 6, removed: 1, summary: "Expose isGap() and gapAt()" }],
  },
  {
    path: "CHANGELOG.md",
    edits: [{ id: "c1", at: at(11.6), added: 3, removed: 0, summary: "Note the fix under Unreleased", diff: "+### Fixed\n+- Local times in a skipped hour now move forward instead of throwing (#471)" }],
  },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { DiffTimeline } = ui;
  const [time, setTime] = useState<number | null>(null);
  return (
    <div style={{ width: "100%", maxWidth: 720, display: "grid", gap: 10 }}>
      <DiffTimeline
        title="Fix parsing in the skipped hour"
        description="Pull request #482 · calendar library"
        files={FILES}
        start={START}
        end={at(12)}
        time={time}
        onTimeChange={setTime}
        defaultSelected="l2"
      />
      <div style={{ ...caption, textAlign: "center" }}>
        Point at an edit for its diff, or drag the scrubber to replay the run.{" "}
        <button type="button" style={textButton} onClick={() => setTime(time === null ? at(4) : null)}>
          {time === null ? "Go back to minute 4" : "Show the whole run"}
        </button>
      </div>
    </div>
  );
}
