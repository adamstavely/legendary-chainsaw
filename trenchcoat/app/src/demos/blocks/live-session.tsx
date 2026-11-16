import { useState } from "react";
import type * as UI from "@blocks/live-session";
import { caption, textButton } from "../../demo-kit";

/* A regional transit authority's agents preparing the winter service-change notice, with you in the loop. */

const T = Date.UTC(2026, 10, 14, 9, 0);
const MIN = 60_000;

const TEAM: UI.LiveSessionParticipant[] = [
  { id: "you", name: "You", kind: "person" },
  { id: "planner", name: "Planner", kind: "agent", model: "Sonnet 5.5" },
  { id: "scheduler", name: "Scheduler", kind: "agent", model: "Opus 5.5" },
  { id: "translator", name: "Translator", kind: "agent", model: "Sonnet 5.5" },
  { id: "access", name: "Reviewer", kind: "agent", model: "Haiku 5.5" },
];

const MESSAGES: UI.LiveSessionMessage[] = [
  { id: "m1", from: "planner", to: "everyone", at: T - 14 * MIN, text: "41 of 212 stops change on 8 December – the list is in stops.csv.", files: [{ id: "f1", name: "stops.csv", preview: "stop_id,route,change\n4-118,4,moved\n12-031,12,removed" }] },
  { id: "m2", from: "planner", to: "scheduler", at: T - 12 * MIN, kind: "handoff", text: "Handing the timetables to Scheduler" },
  { id: "m3", from: "scheduler", to: "everyone", at: T - 7 * MIN, text: "Routes 4 and 12 are drafted. Route 31's last run would move from 23:40 to 23:10." },
  { id: "m4", from: "scheduler", to: "you", at: T - 6 * MIN, kind: "question", text: "Should the notice publish route 31's earlier last run, or wait for the depot?" },
  { id: "m5", from: "translator", to: "everyone", at: T - 3 * MIN, text: "Spanish is done. Waiting on the route-name glossary before Vietnamese." },
  { id: "m6", from: "access", to: "translator", at: T - 1 * MIN, text: "Checking the Spanish PDF's reading order now", streaming: true },
];

const STEPS: UI.LiveSessionStep[] = [
  { id: "s1", title: "List the stops that change", agentId: "planner", status: "done" },
  { id: "s2", title: "Confirm the date with the depot", agentId: "planner", status: "done" },
  { id: "s3", title: "Draft timetables for routes 4 and 12", agentId: "scheduler", status: "done" },
  { id: "s4", title: "Route 31's last run", agentId: "scheduler", status: "active", detail: "Waiting for your answer" },
  { id: "s5", title: "Translate into Spanish", agentId: "translator", status: "done" },
  { id: "s6", title: "Translate into Vietnamese", agentId: "translator", status: "failed", detail: "Needs the route-name glossary" },
  { id: "s7", title: "Check PDFs for screen readers", agentId: "access", status: "active" },
  { id: "s8", title: "Send to the print shop", status: "pending" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { LiveSession } = ui;
  const [agent, setAgent] = useState<string | null>("scheduler");
  return (
    <div style={{ display: "grid", gap: "var(--tc-space-3)" }}>
      <LiveSession participants={TEAM} messages={MESSAGES} steps={STEPS} context={0.62} contextText="124k of 200k tokens" agent={agent} onAgentChange={(id) => setAgent(id)} onSend={() => {}} />
      <p style={caption}>
        Pick an agent to point at its steps.{" "}
        <button type="button" style={textButton} onClick={() => setAgent(agent === "translator" ? null : "translator")}>
          {agent === "translator" ? "Show the whole team" : "Point at Translator"}
        </button>
      </p>
    </div>
  );
}
