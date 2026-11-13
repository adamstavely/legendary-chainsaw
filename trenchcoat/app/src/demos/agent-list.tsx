import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { AgentListItem } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fictional research institute's operations agents. The times are fixed, so the list is the same on every visit. */

const NOW = Date.UTC(2026, 10, 12, 15, 0);
const H = 3_600_000;
const AGENTS: AgentListItem[] = [
  { id: "invoice", name: "Invoice matcher", description: "Matches supplier invoices to purchase orders", owner: "Finance operations", status: "failing", model: "Model M", lastRun: { at: NOW - 2 * H, status: "failed" }, runs7d: 48, failureRate: 0.25, cost7d: 6.4, attention: "The purchase-order export timed out on 12 of 48 runs this week." },
  { id: "policy", name: "Policy Q&A", description: "Answers staff questions from the policy library", owner: "People team", status: "live", model: "Model S", lastRun: { at: NOW - 0.3 * H, status: "succeeded" }, runs7d: 312, failureRate: 0.01, cost7d: 18.75 },
  { id: "vendor", name: "Vendor risk monitor", description: "Checks vendors' certifications and news each morning", owner: "Audit office", status: "live", model: "Model M", lastRun: { at: NOW - 6 * H, status: "succeeded" }, runs7d: 7, failureRate: 0, cost7d: 2.1 },
  { id: "expense", name: "Expense checker", description: "Flags claims that break the travel policy", owner: "Finance operations", status: "paused", model: "Model S", lastRun: { at: NOW - 50 * H, status: "succeeded" }, runs7d: 0, failureRate: 0, cost7d: 0 },
  { id: "grant", name: "Grant report drafter", description: "Drafts quarterly grant reports from the ledger", owner: "Research office", status: "draft", model: "Model L" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AgentList } = ui;
  const [opened, setOpened] = useState<string | null>(null);
  const [agents, setAgents] = useState(AGENTS);
  const fixed = agents[0]!.status !== "failing";
  return (
    <div style={{ width: "100%", maxWidth: 720, display: "grid", gap: 8 }}>
      <AgentList title="Operations agents" description="Research institute workspace" agents={agents} now={NOW} locale="en-GB" onAgentOpen={(id) => setOpened(id)} />
      <div style={{ ...caption, textAlign: "center" }}>
        {opened ? `Opened ${agents.find((a) => a.id === opened)?.name}. ` : "Search, filter by status, sort, or open an agent. "}
        <button
          type="button"
          style={textButton}
          onClick={() => setAgents(fixed ? AGENTS : AGENTS.map((a) => (a.id === "invoice" ? { ...a, status: "live", attention: undefined, failureRate: 0.02, lastRun: { at: NOW, status: "succeeded" } } : a)))}
        >
          {fixed ? "Break the invoice matcher again" : "Fix the invoice matcher"}
        </button>
      </div>
    </div>
  );
}
