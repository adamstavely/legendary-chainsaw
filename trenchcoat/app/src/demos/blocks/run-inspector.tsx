import { useState } from "react";
import type * as UI from "@blocks/run-inspector";
import { caption, textButton } from "../../demo-kit";

/* One run of a regional transit authority's agents preparing the winter service-change notice. Times in ms from the start. */

const S = 1000;

const RUN: UI.InspectorSpan = {
  id: "run",
  name: "Winter service-change notice",
  kind: "agent",
  status: "failed",
  model: "Opus 5.5",
  detail: "Routes 4, 12 and 31 from 8 December",
  start: 0,
  end: 214 * S,
  children: [
    { id: "l1", name: "Plan the notice", kind: "llm", status: "done", start: 0, end: 9 * S, model: "Opus 5.5", tokensIn: 4200, tokensOut: 910, cost: 0.11 },
    {
      id: "planner",
      name: "Planner",
      kind: "subagent",
      status: "done",
      model: "Sonnet 5.5",
      detail: "List every stop and timetable that changes",
      start: 10 * S,
      end: 82 * S,
      children: [
        { id: "p1", name: "timetable_lookup", kind: "tool", status: "done", detail: "routes 4, 12, 31", start: 12 * S, end: 30 * S, input: '{ "routes": [4, 12, 31] }', output: "212 stops, 41 changed" },
        { id: "p2", name: "Summarise changes", kind: "llm", status: "done", start: 31 * S, end: 52 * S, tokensIn: 9800, tokensOut: 1400, cost: 0.06 },
        { id: "p3", name: "depot_calendar", kind: "tool", status: "done", detail: "December", start: 53 * S, end: 70 * S, output: "Change confirmed for 8 December" },
        { id: "p4", name: "Write the stop list", kind: "llm", status: "done", start: 71 * S, end: 82 * S, tokensIn: 6100, tokensOut: 2200, cost: 0.05 },
      ],
    },
    {
      id: "translator",
      name: "Translator",
      kind: "subagent",
      status: "failed",
      model: "Sonnet 5.5",
      detail: "Translate the notice into Spanish and Vietnamese",
      start: 84 * S,
      end: 140 * S,
      children: [
        { id: "t1", name: "read_file", kind: "tool", status: "failed", detail: "route-names-glossary.csv", start: 86 * S, end: 88 * S, input: '{ "path": "shared/route-names-glossary.csv" }', error: "Permission denied: the file is in a folder the agent can't read" },
        { id: "t2", name: "Translate to Spanish", kind: "llm", status: "done", start: 89 * S, end: 120 * S, tokensIn: 5200, tokensOut: 5600, cost: 0.09 },
        { id: "t3", name: "Translate to Vietnamese", kind: "llm", status: "failed", start: 121 * S, end: 140 * S, tokensIn: 5200, tokensOut: 0, cost: 0.03, error: "Stopped: route names must come from the glossary" },
      ],
    },
    {
      id: "access",
      name: "Accessibility reviewer",
      kind: "subagent",
      status: "done",
      model: "Haiku 5.5",
      detail: "Check the notice and its PDFs",
      start: 142 * S,
      end: 210 * S,
      children: [
        { id: "a1", name: "pdf_tags", kind: "tool", status: "done", detail: "notice-en.pdf", start: 144 * S, end: 160 * S, output: "Tagged, reading order correct" },
        { id: "a2", name: "Plain-language check", kind: "llm", status: "done", start: 161 * S, end: 190 * S, tokensIn: 3900, tokensOut: 700, cost: 0.02 },
        { id: "a3", name: "contrast_check", kind: "tool", status: "done", detail: "poster.png", start: 191 * S, end: 205 * S, output: "All text passes AA" },
      ],
    },
  ],
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { RunInspector } = ui;
  const [selected, setSelected] = useState<string | null>("t1");
  return (
    <div style={{ display: "grid", gap: "var(--tc-space-3)" }}>
      <RunInspector root={RUN} selected={selected} onSelectedChange={(id) => setSelected(id)} />
      <p style={caption}>
        Click any call to open it under its row.{" "}
        <button type="button" style={textButton} onClick={() => setSelected(selected ? null : "t1")}>
          {selected ? "Close the open call" : "Open the failed read"}
        </button>
      </p>
    </div>
  );
}
