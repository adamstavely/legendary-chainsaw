import { useState } from "react";
import type * as UI from "@components/progress-tracker";

const Dot = ({ color, letter }: { color: string; letter: string }) => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <rect width="20" height="20" rx="5" fill={color} />
    <text x="10" y="14" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff" fontFamily="system-ui, sans-serif">
      {letter}
    </text>
  </svg>
);

const STEPS: UI.ProgressStep[] = [
  { id: "account", label: "Create your account", done: true },
  { id: "slack", label: "Connect Slack", icon: <Dot color="#4A154B" letter="S" /> },
  { id: "github", label: "Link a GitHub repository", icon: <Dot color="#181717" letter="G" /> },
  { id: "invite", label: "Invite two teammates" },
  { id: "notion", label: "Import docs from Notion", icon: <Dot color="#000000" letter="N" /> },
  { id: "deploy", label: "Ship your first deploy" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ProgressTracker } = ui;
  const [count, setCount] = useState(STEPS.filter((s) => s.done).length);

  return (
    <div style={{ width: "100%", maxWidth: 360, display: "grid", gap: 12, justifyItems: "center" }}>
      <div style={{ width: "100%" }}>
        <ProgressTracker
          title="Getting started"
          steps={STEPS}
          autoPlay
          interval={1800}
          onChange={(steps) => setCount(steps.filter((s) => s.done).length)}
        />
      </div>
      <div style={{ fontSize: 12, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))", textAlign: "center" }} aria-live="polite">
        {count} of {STEPS.length} done · plays on its own until you tick a step
      </div>
    </div>
  );
}
