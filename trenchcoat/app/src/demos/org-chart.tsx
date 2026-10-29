import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { OrgChartPerson } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fictional research institute: a director, three departments (Research, Operations, Data) and their teams, two
   open roles and someone away. Fold a branch with its "reports" button, search for a team, pick a person to see their
   manager and reports, or narrow the stage for the outline. */

const PEOPLE: OrgChartPerson[] = [
  { id: "dir", name: "Ines Okafor", title: "Director", team: "Leadership", location: "Rotterdam" },
  { id: "res", name: "Tomás Reyes", title: "Head of Research", team: "Research", manager: "dir", location: "Lisbon" },
  { id: "ops", name: "Mira Lindqvist", title: "Head of Operations", team: "Operations", manager: "dir", location: "Stockholm" },
  { id: "dat", name: "Kwame Asante", title: "Head of Data", team: "Data", manager: "dir", location: "Accra" },
  { id: "r1", name: "Hana Sato", title: "Principal scientist", team: "Coastal ecology", manager: "res", location: "Kyoto" },
  { id: "r2", name: "Elif Demir", title: "Senior scientist", team: "Coastal ecology", manager: "r1", status: "away" },
  { id: "r3", name: "Jonas Weber", title: "Research associate", team: "Coastal ecology", manager: "r1" },
  { id: "r4", name: "Open role", title: "Postdoctoral fellow", team: "Coastal ecology", manager: "r1", status: "vacant" },
  { id: "r5", name: "Priya Nair", title: "Principal scientist", team: "Climate models", manager: "res", location: "Pune" },
  { id: "r6", name: "Lucas Moreau", title: "Research engineer", team: "Climate models", manager: "r5" },
  { id: "r7", name: "Ana Kovač", title: "Research associate", team: "Climate models", manager: "r5" },
  { id: "o1", name: "Samuel Brooks", title: "Facilities lead", team: "Facilities", manager: "ops" },
  { id: "o2", name: "Leila Haddad", title: "Lab manager", team: "Facilities", manager: "o1" },
  { id: "o3", name: "Diego Ramos", title: "Technician", team: "Facilities", manager: "o1" },
  { id: "o4", name: "Grace Liu", title: "Grants manager", team: "Finance", manager: "ops" },
  { id: "o5", name: "Noah Fischer", title: "Finance officer", team: "Finance", manager: "o4" },
  { id: "o6", name: "Amara Obi", title: "People partner", team: "People", manager: "ops", status: "away" },
  { id: "d1", name: "Yusuf Kaya", title: "Data platform lead", team: "Platform", manager: "dat" },
  { id: "d2", name: "Sofia Rossi", title: "Data engineer", team: "Platform", manager: "d1" },
  { id: "d3", name: "Open role", title: "Data engineer", team: "Platform", manager: "d1", status: "vacant" },
  { id: "d4", name: "Ben Carter", title: "Analytics lead", team: "Analytics", manager: "dat" },
  { id: "d5", name: "Mei Chen", title: "Data scientist", team: "Analytics", manager: "d4" },
  { id: "d6", name: "Omar Said", title: "Data scientist", team: "Analytics", manager: "d4" },
  { id: "d7", name: "Isla MacLeod", title: "Data steward", team: "Analytics", manager: "d4" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { OrgChart } = ui;
  const [layout, setLayout] = useState<"auto" | "list">("auto");
  return (
    <div style={{ width: "100%", display: "grid", gap: 10 }}>
      <OrgChart title="Northfield Research Institute" people={PEOPLE} defaultSelected="r1" layout={layout} />
      <div style={{ ...caption, textAlign: "center" }}>
        Fold a branch, search “data”, or pick a person.{" "}
        <button type="button" style={textButton} onClick={() => setLayout((l) => (l === "list" ? "auto" : "list"))}>
          {layout === "list" ? "Show the chart" : "Show as a list"}
        </button>
      </div>
    </div>
  );
}
