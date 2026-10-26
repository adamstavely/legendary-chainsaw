import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ToolPermissionAgent, ToolPermissionMatrix, ToolPermissionTool } from "../../../src/elements/react";
import { caption } from "../demo-kit";

const Star = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M8 1.5l1.7 4.8 4.8 1.7-4.8 1.7L8 14.5l-1.7-4.8L1.5 8l4.8-1.7z" fill={color} />
  </svg>
);
const mark = (d: string) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const AGENTS: ToolPermissionAgent[] = [
  { id: "coder", name: "Coder", model: "Sonnet", avatar: <Star color="#d97757" /> },
  { id: "research", name: "Researcher", model: "Haiku", avatar: <Star color="#6a9bcc" /> },
  { id: "ops", name: "Ops", model: "Opus", avatar: <Star color="#788c5d" /> },
];

const TOOLS: ToolPermissionTool[] = [
  {
    id: "github",
    name: "GitHub",
    icon: mark("M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4M9 18c-4.51 2-5-2-7-2"),
    scopes: [
      { id: "read", label: "Read code", description: "Repos, issues and pull requests" },
      { id: "pr", label: "Open pull requests", risk: "risky" },
      { id: "push", label: "Push to main", description: "Skips review and the merge queue", risk: "destructive" },
    ],
  },
  {
    id: "slack",
    name: "Slack",
    icon: mark("M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5zM20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5zM3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"),
    scopes: [
      { id: "read", label: "Read channels" },
      { id: "post", label: "Post in channels", risk: "risky" },
      { id: "dm", label: "Message customers", description: "Shared Connect channels", risk: "risky" },
    ],
  },
  {
    id: "stripe",
    name: "Stripe",
    icon: mark("M2 7h20v12H2zM2 11h20"),
    scopes: [
      { id: "read", label: "Read invoices" },
      { id: "refund", label: "Issue refunds", description: "Up to $500 per refund", risk: "destructive" },
    ],
  },
];

/** "Ask first", with Researcher kept away from customers and Ops trusted with pull requests */
const SAVED: ToolPermissionMatrix = {
  coder: { "github/read": "allow", "github/pr": "allow", "github/push": "ask", "slack/read": "allow", "slack/post": "ask", "slack/dm": "deny", "stripe/read": "deny", "stripe/refund": "deny" },
  research: { "github/read": "allow", "github/pr": "deny", "github/push": "deny", "slack/read": "allow", "slack/post": "ask", "slack/dm": "deny", "stripe/read": "allow", "stripe/refund": "deny" },
  ops: { "github/read": "allow", "github/pr": "ask", "github/push": "deny", "slack/read": "allow", "slack/post": "allow", "slack/dm": "ask", "stripe/read": "allow", "stripe/refund": "ask" },
};
/** Two edits already made, so the summary has something to say */
const START: ToolPermissionMatrix = {
  ...SAVED,
  coder: { ...SAVED.coder, "slack/post": "allow" },
  ops: { ...SAVED.ops, "github/pr": "allow" },
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ToolPermissions } = ui;
  const [value, setValue] = useState(START);
  const [saved, setSaved] = useState(SAVED);
  const [note, setNote] = useState("Click a cell, or pick a preset – Save keeps it.");
  return (
    <div style={{ width: "100%", maxWidth: 640, display: "grid", gap: 8 }}>
      <ToolPermissions
        title="Tool permissions"
        description="What each agent may do without asking. Runs pick this up at their next step."
        agents={AGENTS}
        tools={TOOLS}
        value={value}
        onChange={(next, { cause }) => {
          setValue(next);
          setNote(cause.type === "preset" ? "Preset applied to every agent." : cause.type === "reset" ? "Back to what was saved." : "Changed – not saved yet.");
        }}
        saved={saved}
        onSave={(next, changes) => {
          setSaved(next);
          setNote(`Saved ${changes.length} ${changes.length === 1 ? "change" : "changes"}.`);
        }}
      />
      <div style={{ ...caption, textAlign: "center" }}>{note}</div>
    </div>
  );
}
