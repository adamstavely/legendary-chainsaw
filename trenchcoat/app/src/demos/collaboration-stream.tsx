import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { CollabMessage, CollabParticipant, CollabSend } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's agents preparing the annual field-survey report: the orchestrator hands out work, the
   researcher pulls the station data, the writer drafts the methods section, and one question waits for you. */

const T0 = Date.UTC(2026, 10, 5, 13, 2);
const at = (min: number) => T0 + min * 60_000;

const PEOPLE: CollabParticipant[] = [
  { id: "you", name: "You", kind: "person", initials: "YO" },
  { id: "orch", name: "Orchestrator", kind: "agent", model: "Opus 5.5" },
  { id: "res", name: "Researcher", kind: "agent", model: "Sonnet 5.5" },
  { id: "wri", name: "Writer", kind: "agent", model: "Sonnet 5.5" },
  { id: "chk", name: "Data checker", kind: "agent", model: "Haiku 5.5" },
];

const STATIONS = `station,year,plots,species
North Ridge,2023,42,118
North Ridge,2024,42,121
River Flats,2023,36,97
River Flats,2024,38,102
Upper Meadow,2024,30,88`;

const START: CollabMessage[] = [
  { id: "m1", from: "you", to: "orch", at: at(0), text: "Prepare the annual field-survey report by Friday – methods, results per station, and a one-page summary." },
  { id: "e1", from: "orch", to: "res", at: at(1), kind: "handoff", text: "Orchestrator started Researcher" },
  { id: "e2", from: "orch", to: "wri", at: at(1), kind: "handoff", text: "Orchestrator started Writer" },
  {
    id: "m2",
    from: "orch",
    to: "res",
    at: at(1),
    text: "Collect the plot counts for every station since 2016, and flag any station with gaps.",
    details: { model: "Opus 5.5", tokens: 3200, cost: 0.03, ms: 2100 },
  },
  {
    id: "m3",
    from: "res",
    to: "orch",
    at: at(4),
    text: "All 3 stations have counts for 2023 and 2024. Upper Meadow only started in 2024, so it has no earlier years.",
    files: [{ id: "f1", name: "station-counts.csv", preview: STATIONS }],
    details: {
      model: "Sonnet 5.5",
      tokens: 41_200,
      cost: 0.02,
      ms: 108_000,
      tools: [
        {
          name: "archive_search",
          summary: "6 searches – plot counts 2016–2025",
          results: [
            { title: "Field log, North Ridge", text: "42 plots, surveyed each June" },
            { title: "Field log, River Flats", text: "36 plots in 2023, 38 from 2024" },
            { title: "Field log, Upper Meadow", text: "New station, first survey in 2024" },
          ],
        },
      ],
    },
  },
  { id: "e3", from: "orch", to: "chk", at: at(5), kind: "handoff", text: "Orchestrator started Data checker" },
  {
    id: "m4",
    from: "chk",
    to: "you",
    at: at(7),
    kind: "question",
    text: "Upper Meadow has only one year. Should the report cover 2023–2024 for every station, or 2016 onwards where there's data?",
    details: { model: "Haiku 5.5", tokens: 2100, cost: 0.004, ms: 3400 },
  },
  { id: "m5", from: "orch", to: "wri", at: at(8), text: "Draft the methods section – one paragraph on how plots were chosen and counted." },
  { id: "m6", from: "wri", to: "orch", at: at(9), text: "Plots were placed on a fixed grid at each station and", streaming: true },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { CollaborationStream } = ui;
  const [messages, setMessages] = useState(START);
  const [n, setN] = useState(0);
  const send = (m: CollabSend) => {
    setN((k) => k + 1);
    setMessages((list) => [
      ...list.map((x) => (x.id === m.replyTo ? { ...x, answered: true } : x)),
      { id: `sent-${n}`, from: "you", to: m.to, at: at(10 + n), text: m.text },
    ]);
  };
  const writing = messages.some((m) => m.streaming);
  const finish = () =>
    setMessages((list) =>
      writing
        ? list.map((m) => (m.streaming ? { ...m, streaming: false, text: "Plots were placed on a fixed grid at each station and surveyed once each June; every vascular plant species inside a plot was counted." } : m))
        : START,
    );
  return (
    <div style={{ width: "100%", maxWidth: 680, display: "grid", gap: 8 }}>
      <CollaborationStream title="Annual field-survey report" description="Due Friday · 4 agents" participants={PEOPLE} messages={messages} onSend={send} locale="en-GB" timeZone="UTC" />
      <div style={{ ...caption, textAlign: "center" }}>
        Answer the question, open a file or a message's details, or filter by agent.{" "}
        <button type="button" style={textButton} onClick={finish}>
          {writing ? "Finish the Writer's message" : "Start again"}
        </button>
      </div>
    </div>
  );
}
