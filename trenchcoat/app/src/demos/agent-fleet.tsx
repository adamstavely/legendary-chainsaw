import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { FleetAgent } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's agents at work on the annual report season – four leads, each with its own helpers. */

const NOW = Date.UTC(2026, 10, 5, 14, 0);
const ago = (min: number) => NOW - min * 60_000;

const FLEET: FleetAgent[] = [
  {
    id: "report",
    name: "Report lead",
    model: "Opus 5.5",
    task: "Prepare the annual field-survey report by Friday",
    status: "running",
    cost: 0.42,
    started: ago(14),
    children: [
      { id: "r-res", name: "Researcher", model: "Sonnet 5.5", task: "Collect the plot counts for every station", status: "done", cost: 0.31, started: ago(13), ended: ago(6) },
      { id: "r-wri", name: "Writer", model: "Sonnet 5.5", task: "Draft the methods section", status: "running", cost: 0.18, started: ago(6) },
      { id: "r-chk", name: "Data checker", model: "Haiku 5.5", task: "Check every station's year range", status: "waiting", cost: 0.04, started: ago(9), ask: "Cover 2023–2024 for every station, or 2016 onwards where there's data?" },
      { id: "r-fig", name: "Figures", model: "Sonnet 5.5", task: "Chart species counts per station", status: "queued" },
    ],
  },
  {
    id: "data",
    name: "Data lead",
    model: "Sonnet 5.5",
    task: "Clean and load this season's station uploads",
    status: "running",
    cost: 0.22,
    started: ago(26),
    children: [
      { id: "d-up", name: "Uploader", model: "Haiku 5.5", task: "Load the June survey sheets", status: "done", cost: 0.06, started: ago(25), ended: ago(19) },
      { id: "d-val", name: "Validator", model: "Haiku 5.5", task: "Flag counts outside last year's range", status: "running", cost: 0.05, started: ago(18) },
      { id: "d-geo", name: "Mapper", model: "Haiku 5.5", task: "Match plots to grid squares", status: "running", cost: 0.04, started: ago(15) },
      { id: "d-dup", name: "De-duplicator", model: "Haiku 5.5", task: "Merge repeated plot entries", status: "done", cost: 0.02, started: ago(24), ended: ago(20) },
    ],
  },
  {
    id: "grants",
    name: "Grants assistant",
    model: "Sonnet 5.5",
    task: "Draft the progress note for the field-station grant",
    status: "running",
    cost: 0.21,
    started: ago(38),
    children: [
      { id: "g-bud", name: "Budget", model: "Haiku 5.5", task: "Sum this year's field costs", status: "done", cost: 0.05, started: ago(37), ended: ago(30) },
      { id: "g-mil", name: "Milestones", model: "Haiku 5.5", task: "List milestones met since the last note", status: "failed", cost: 0.03, started: ago(30), ended: ago(28), error: "The milestone sheet is locked by another editor" },
      { id: "g-dr", name: "Drafter", model: "Sonnet 5.5", task: "Write the two-page note", status: "queued" },
    ],
  },
  {
    id: "archive",
    name: "Archive curator",
    model: "Opus 5.5",
    task: "File last season's raw sheets in the archive",
    status: "done",
    cost: 0.34,
    started: ago(64),
    ended: ago(22),
    children: [
      { id: "a-scan", name: "Scanner", model: "Haiku 5.5", task: "Read the scanned sheets", status: "done", cost: 0.12, started: ago(63), ended: ago(40) },
      { id: "a-tag", name: "Tagger", model: "Haiku 5.5", task: "Tag each sheet with station and date", status: "done", cost: 0.08, started: ago(40), ended: ago(30) },
      { id: "a-file", name: "Filer", model: "Haiku 5.5", task: "Move the sheets into the archive", status: "done", cost: 0.05, started: ago(30), ended: ago(22) },
    ],
  },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AgentFleet } = ui;
  const [agents, setAgents] = useState(FLEET);
  const answered = !agents[0].children!.some((c) => c.status === "waiting");
  const toggle = () =>
    setAgents(answered ? FLEET : (list) => list.map((a) => (a.id === "report" ? { ...a, children: a.children!.map((c) => (c.status === "waiting" ? { ...c, status: "running" as const } : c)) } : a)));
  return (
    <div style={{ width: "100%", maxWidth: 960, display: "grid", gap: 8 }}>
      <AgentFleet title="Report season" agents={agents} now={NOW} defaultOpen="report" />
      <div style={{ ...caption, textAlign: "center" }}>
        Open a card for its tree; arrows move between cards, Escape closes.{" "}
        <button type="button" style={textButton} onClick={toggle}>
          {answered ? "Put the question back" : "Answer the Data checker"}
        </button>
      </div>
    </div>
  );
}
