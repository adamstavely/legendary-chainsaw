import type * as UI from "../../../src/elements/react";
import type { RoadmapItem, RoadmapLane } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* A fictional research institute's 2027 plan: three workstreams, a launch milestone, and one piece of work planned to
   start before what it waits for ends – its arrow is red. Today is fixed so the picture doesn't move. */

const LANES: RoadmapLane[] = [
  { id: "reef", label: "Coral reef sensors", owner: "Marine lab" },
  { id: "data", label: "Open data portal", owner: "Data team" },
  { id: "lab", label: "Lab booking app", owner: "Facilities" },
];

const ITEMS: RoadmapItem[] = [
  { id: "proto", lane: "reef", label: "Sensor prototype", start: "2027-01-11", end: "2027-02-26", status: "done" },
  { id: "field", lane: "reef", label: "Field trial, two reefs", start: "2027-03-01", end: "2027-05-14", status: "active", progress: 0.45, dependsOn: ["proto"] },
  { id: "deploy", lane: "reef", label: "Deploy network", start: "2027-05-17", end: "2027-07-30", status: "planned", dependsOn: ["field"] },
  { id: "schema", lane: "data", label: "Dataset schema", start: "2027-01-18", end: "2027-03-12", status: "done" },
  { id: "ingest", lane: "data", label: "Ingest pipeline", start: "2027-03-08", end: "2027-05-21", status: "at-risk", progress: 0.3, dependsOn: ["schema"] },
  { id: "launch", lane: "data", label: "Public launch", start: "2027-06-15", milestone: true, dependsOn: ["ingest"] },
  { id: "rooms", lane: "lab", label: "Room inventory", start: "2027-02-01", end: "2027-03-05", status: "done" },
  { id: "app", lane: "lab", label: "Booking app beta", start: "2027-03-15", end: "2027-06-04", status: "blocked", progress: 0.1, dependsOn: ["rooms"] },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { RoadmapTimeline } = ui;
  return (
    <div style={{ width: "100%", display: "grid", gap: 10 }}>
      <RoadmapTimeline title="2027 roadmap" description="Research institute · three workstreams" lanes={LANES} items={ITEMS} today="2027-04-07" defaultSelected="ingest" />
      <div style={{ ...caption, textAlign: "center" }}>Click a bar or use the arrow keys, switch the scale, follow an arrow to what it waits for.</div>
    </div>
  );
}
