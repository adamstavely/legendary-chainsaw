import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { CrewHandoff, CrewProject } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fictional crew writing a grant application for a community library: the lead splits the work between a
   researcher, a budget agent and an editor, and the researcher has a fact-checker of its own. "Hand off next" passes
   the next piece of work along, so a light runs along the connector and the card it reaches lights up. A second
   project, a reading-programme report, shows the tabs. */

const GRANT: CrewProject = {
  id: "grant",
  name: "Library grant",
  lead: {
    id: "lead",
    name: "Lead",
    role: "Plans and assembles",
    status: "working",
    doing: "Merging the needs statement",
    context: 0.48,
    tools: ["Docs", "Tasks"],
    task: "Write the Riverside Library's application to the Community Learning Fund",
    model: "Atlas",
    tokens: 41200,
    cost: 0.62,
    children: [
      {
        id: "research",
        name: "Researcher",
        role: "Finds the evidence",
        status: "working",
        doing: "Reading the 2025 census tables",
        context: 0.81,
        tools: ["Web search", "Sheets", "PDF reader", "Notes"],
        task: "Back every claim about local need with a source",
        model: "Atlas",
        tokens: 88300,
        cost: 1.12,
        children: [
          {
            id: "facts",
            name: "Fact-checker",
            role: "Checks the numbers",
            status: "resting",
            context: 0.12,
            tools: ["Sheets"],
            task: "Recheck every figure the researcher cites",
            model: "Atlas Mini",
            tokens: 6100,
            cost: 0.04,
          },
        ],
      },
      {
        id: "budget",
        name: "Budget",
        role: "Costs the project",
        status: "waiting",
        doing: "Needs the opening hours to cost staffing",
        context: 0.34,
        tools: ["Sheets"],
        task: "Draft the three-year budget table",
        model: "Atlas",
        tokens: 22800,
        cost: 0.31,
      },
      {
        id: "editor",
        name: "Editor",
        role: "Writes it up",
        status: "resting",
        context: 0.07,
        tools: ["Docs", "Style guide"],
        handed: "The fund's writing guidance",
        task: "Turn the sections into one voice under 2,000 words",
        model: "Atlas",
        tokens: 3200,
        cost: 0.05,
      },
    ],
  },
  handoffs: [{ id: "h1", from: "lead", to: "research", what: "Questions about local need" }],
};

const REPORT: CrewProject = {
  id: "report",
  name: "Reading programme report",
  lead: {
    id: "r-lead",
    name: "Lead",
    role: "Plans and assembles",
    status: "resting",
    context: 0.22,
    tools: ["Docs"],
    children: [
      { id: "r-data", name: "Analyst", role: "Counts the loans", status: "done", doing: "Summer loans tallied", context: 0.4, tools: ["Sheets"] },
      { id: "r-write", name: "Writer", role: "Writes the summary", status: "paused", doing: "Paused by you", context: 0.18, tools: ["Docs"] },
    ],
  },
};

const NEXT: CrewHandoff[] = [
  { id: "h2", from: "research", to: "facts", what: "Census figures to recheck" },
  { id: "h3", from: "lead", to: "budget", what: "Opening hours, 2026" },
  { id: "h4", from: "research", to: "lead", what: "Needs statement sources" },
  { id: "h5", from: "lead", to: "editor", what: "Draft sections 1–3" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AgentCrew } = ui;
  const [grant, setGrant] = useState(GRANT);
  const [step, setStep] = useState(0);
  const [note, setNote] = useState("");
  const next = NEXT[step % NEXT.length];

  return (
    <div style={{ width: "100%", maxWidth: 820, display: "grid", gap: 10 }}>
      <AgentCrew
        title="Grant crew"
        projects={[grant, REPORT]}
        defaultOpened="budget"
        onSteer={(agent, text) => setNote(`Sent to ${agent.name}: “${text}”`)}
        onPauseAgent={(agent) => setNote(`Paused ${agent.name}`)}
        onResumeAgent={(agent) => setNote(`Resumed ${agent.name}`)}
      />
      <p style={{ ...caption, margin: 0, textAlign: "center" }}>
        {note || "Open a card to steer or pause that agent"}{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setGrant((g) => ({ ...g, handoffs: [...(g.handoffs ?? []), { ...next, id: `${next.id}-${step}` }] }));
            setStep((n) => n + 1);
          }}
        >
          Hand off next
        </button>
      </p>
    </div>
  );
}
