import type * as UI from "../../../src/elements/react";
import type { HovercardPerson } from "../../../src/elements/react";
import { caption, surface } from "../demo-kit";

/* A meeting note from a fictional research institute with the people in it marked. Point at a name, focus it, or tap
   it for their card: status, local time, who they report to, Email, Message and View profile. One name is looked up
   (after a short wait, from a made-up directory in this file); the others come with the page. */

const NOW = Date.UTC(2026, 9, 28, 15, 12);

const MIRA: HovercardPerson = {
  id: "mira",
  name: "Mira Lindqvist",
  pronouns: "she/her",
  title: "Head of Operations",
  team: "Operations",
  email: "mira.lindqvist@northfield.example",
  location: "Stockholm",
  timezone: "Europe/Stockholm",
  status: { state: "busy", text: "In a review until 4" },
  manager: { name: "Ines Okafor" },
  links: [{ label: "Team page", href: "https://northfield.example.org/teams/operations" }],
};
const HANA: HovercardPerson = {
  id: "hana",
  name: "Hana Sato",
  pronouns: "she/her",
  title: "Principal scientist",
  team: "Coastal ecology",
  email: "hana.sato@northfield.example",
  location: "Kyoto",
  timezone: "Asia/Tokyo",
  status: { state: "away", text: "Fieldwork this week" },
  manager: { name: "Tomás Reyes" },
};
const DIRECTORY: Record<string, HovercardPerson> = {
  kwame: {
    id: "kwame",
    name: "Kwame Asante",
    pronouns: "he/him",
    title: "Head of Data",
    team: "Data",
    email: "kwame.asante@northfield.example",
    location: "Accra",
    timezone: "Africa/Accra",
    status: { state: "available" },
    manager: { name: "Ines Okafor" },
  },
};
const lookup = (id: string) => new Promise<HovercardPerson | null>((done) => setTimeout(() => done(DIRECTORY[id] ?? null), 500));

export default function Demo({ ui }: { ui: typeof UI }) {
  const { PersonHovercard } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 10 }}>
      <div style={{ ...surface, padding: 18, lineHeight: 1.7, color: "var(--tc-text-primary)" }}>
        <strong>Field season review</strong>
        <p style={{ margin: "8px 0 0" }}>
          <PersonHovercard person={MIRA} now={NOW}>
            <a href="#/person-hovercard" style={{ color: "var(--tc-accent-text)" }}>
              Mira Lindqvist
            </a>
          </PersonHovercard>{" "}
          will confirm the boat bookings with{" "}
          <PersonHovercard person={HANA} now={NOW}>
            Hana Sato
          </PersonHovercard>
          , who's on fieldwork until Friday. The sensor data goes to{" "}
          <PersonHovercard personId="kwame" resolve={lookup} now={NOW}>
            <a href="#/person-hovercard" style={{ color: "var(--tc-accent-text)" }}>
              Kwame Asante
            </a>
          </PersonHovercard>
          's team for cleaning.
        </p>
      </div>
      <div style={{ ...caption, textAlign: "center" }}>Point at, focus or tap a name for their card.</div>
    </div>
  );
}
