import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { SequenceGroup, SequenceMessage, SequenceParticipant } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's report-drafting run: a planner hands the work to a researcher and a writer, who use tools. */

const S = 1000;
const PEOPLE: SequenceParticipant[] = [
  { id: "you", name: "You", kind: "user" },
  { id: "planner", name: "Planner", kind: "agent", detail: "large-1" },
  { id: "researcher", name: "Researcher", kind: "agent", detail: "small-2" },
  { id: "writer", name: "Writer", kind: "agent", detail: "large-1" },
  { id: "web", name: "Web search", kind: "tool" },
  { id: "pdf", name: "PDF reader", kind: "tool" },
  { id: "sheet", name: "Spreadsheet", kind: "tool" },
];
const GROUPS: SequenceGroup[] = [
  { id: "sources", kind: "parallel", label: "sources" },
  { id: "retry", kind: "retry", label: "2nd try" },
];
const RUN: SequenceMessage[] = [
  { id: "m1", from: "you", to: "planner", kind: "call", label: "Draft the Q3 water-quality report", start: 0, input: "Draft the Q3 report on river water quality for the board, two pages." },
  { id: "m2", from: "planner", to: "researcher", kind: "call", label: "Gather Q3 sampling data", start: 1.2 * S, end: 14.8 * S, tokens: 1840 },
  { id: "m3", from: "researcher", to: "web", kind: "call", label: "search: Q3 river sampling", group: "sources", start: 2.1 * S, end: 3.4 * S },
  { id: "m4", from: "researcher", to: "pdf", kind: "call", label: "read lab-results-q3.pdf", group: "sources", start: 2.1 * S, end: 4.9 * S },
  { id: "m5", from: "web", to: "researcher", kind: "reply", label: "6 results", group: "sources", start: 3.4 * S },
  { id: "m6", from: "pdf", to: "researcher", kind: "error", label: "page 4 unreadable", group: "sources", start: 4.9 * S, output: "The scan on page 4 has no text layer." },
  { id: "m7", from: "researcher", to: "pdf", kind: "call", label: "read with OCR", group: "retry", start: 5.0 * S, end: 8.2 * S },
  { id: "m8", from: "pdf", to: "researcher", kind: "reply", label: "42 sampling rows", group: "retry", start: 8.2 * S, output: "42 rows: site, date, nitrate, phosphate, E. coli" },
  { id: "m9", from: "researcher", to: "sheet", kind: "call", label: "averages per site", start: 8.4 * S, end: 10.1 * S },
  { id: "m10", from: "sheet", to: "researcher", kind: "reply", label: "7 sites", start: 10.1 * S },
  { id: "m11", from: "researcher", to: "planner", kind: "reply", label: "Data and sources", start: 14.8 * S, tokens: 6120 },
  { id: "m12", from: "planner", to: "writer", kind: "call", label: "Write two pages", start: 15.3 * S, end: 31.6 * S, tokens: 2210 },
  { id: "m13", from: "writer", to: "writer", kind: "call", label: "Outline", start: 15.9 * S, end: 17.2 * S },
  { id: "m14", from: "writer", to: "planner", kind: "reply", label: "Draft, 2 pages", start: 31.6 * S, tokens: 9480, output: "Two pages: summary, site table, three findings, next sampling round." },
  { id: "m15", from: "planner", to: "you", kind: "reply", label: "Report ready", start: 32.4 * S },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AgentSequence } = ui;
  const [shown, setShown] = useState(RUN.length);
  const playing = shown < RUN.length;
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setShown((n) => n + 1), 900);
    return () => clearTimeout(t);
  }, [playing, shown]);
  return (
    <div style={{ width: "100%", maxWidth: 820, display: "grid", gap: 8 }}>
      <AgentSequence
        subtitle="Q3 water-quality report · Halden Research Institute"
        participants={PEOPLE}
        messages={RUN.slice(0, shown)}
        groups={GROUPS}
        live={playing}
        defaultOpenId="m6"
      />
      <div style={{ ...caption, textAlign: "center" }}>
        Pick a message or a participant for its details.{" "}
        <button type="button" style={textButton} onClick={() => setShown(1)}>
          Replay the run live
        </button>
      </div>
    </div>
  );
}
