import type * as UI from "../../../src/elements/react";
import type { RosterMember } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* The project team of a fictional coastal-research consortium, spread over five time zones. The clock is fixed so the
   picture is the same every time; "your time" is London. Filter, regroup, or switch to the grid. */

const NOW = Date.UTC(2026, 9, 21, 14, 10);

const MEMBERS: RosterMember[] = [
  { id: "ines", name: "Ines Okafor", role: "Principal investigator", team: "Coordination", timezone: "Europe/London", status: "available", email: "ines.okafor@example.org", skills: ["Ocean modelling", "Grants"] },
  { id: "tomas", name: "Tomás Reyes", role: "Data engineer", team: "Data", timezone: "Europe/Madrid", status: "busy", email: "tomas.reyes@example.org", skills: ["Pipelines", "Python"] },
  { id: "mira", name: "Mira Lindqvist", role: "Field scientist", team: "Fieldwork", timezone: "Europe/Stockholm", status: "away", skills: ["Sampling", "Sonar"] },
  { id: "kofi", name: "Kofi Mensah", role: "Research software engineer", team: "Data", timezone: "Africa/Accra", status: "available", email: "kofi.mensah@example.org", skills: ["Rust", "Visualisation"] },
  { id: "ana", name: "Ana Lima", role: "Field scientist", team: "Fieldwork", timezone: "America/Sao_Paulo", status: "available", email: "ana.lima@example.org", skills: ["Coral surveys"] },
  { id: "jun", name: "Jun Watanabe", role: "Statistician", team: "Data", timezone: "Asia/Tokyo", status: "offline", email: "jun.watanabe@example.org", skills: ["Bayesian methods"] },
  { id: "priya", name: "Priya Raman", role: "Project manager", team: "Coordination", timezone: "Asia/Kolkata", workingHours: { start: "10:00", end: "18:30" }, status: "busy", skills: ["Reporting"] },
  { id: "sam", name: "Sam Carter", role: "Communications lead", team: "Coordination", timezone: "America/New_York", status: "available", email: "sam.carter@example.org", skills: ["Outreach", "Writing"] },
  { id: "lea", name: "Léa Martin", role: "Lab technician", team: "Fieldwork", timezone: "Europe/Paris", workingHours: { start: "07:30", end: "16:00" }, status: "available", skills: ["Spectroscopy"] },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { TeamRoster } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 10 }}>
      <TeamRoster title="Reef resilience project" description="Nine people, five time zones" members={MEMBERS} now={NOW} viewerTimezone="Europe/London" locale="en-GB" />
      <div style={{ ...caption, textAlign: "center" }}>Filter by a skill, group by time zone, or switch to the grid.</div>
    </div>
  );
}
