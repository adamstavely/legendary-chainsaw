import type * as UI from "../../../../src/elements/react";
import { caption } from "../../demo-kit";

/* The reviewers on a case as initials, and the files attached to it: hover or tab in to fan them apart */

const REVIEWERS = [
  ["Ama Owusu", "AO", "info"],
  ["Tomás Reyes", "TR", "success"],
  ["Mei Lin", "ML", "warning"],
  ["Jonas Berg", "JB", "danger"],
  ["Priya Nair", "PN", "info"],
  ["Sam Okafor", "SO", "success"],
] as const;
const FILES = ["ledger-2041.csv", "interview-notes.pdf", "vendor-map.png"];

const avatar = (tone: string): React.CSSProperties => ({
  display: "inline-grid",
  placeItems: "center",
  width: "var(--tc-avatar-md)",
  height: "var(--tc-avatar-md)",
  padding: 0,
  borderRadius: 999,
  border: 0,
  background: `var(--tc-status-${tone}-bg)`,
  color: `var(--tc-status-${tone}-fg)`,
  boxShadow: "0 0 0 2px var(--tc-surface-raised)",
  font: "inherit",
  fontSize: "var(--tc-avatar-font-size)",
  fontWeight: "var(--tc-avatar-font-weight)" as React.CSSProperties["fontWeight"],
  cursor: "default",
});
const chip: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 8,
  background: "var(--tc-surface-raised)",
  boxShadow: "var(--tc-card-shadow)",
  color: "var(--tc-text-primary)",
  fontSize: 12,
  whiteSpace: "nowrap",
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { StackSpread } = ui;
  return (
    <div style={{ display: "grid", gap: 20, justifyItems: "start", width: "100%", maxWidth: 360, fontSize: 12 }}>
      <StackSpread label="Reviewers on case 2041" max={4}>
        {REVIEWERS.map(([name, initials, tone]) => (
          <button key={name} type="button" title={name} style={avatar(tone)}>
            <span aria-hidden="true">{initials}</span>
            <span className="tc-sr-only">{name}</span>
          </button>
        ))}
      </StackSpread>
      <StackSpread label="Attached files">
        {FILES.map((f) => <span key={f} style={chip}>{f}</span>)}
      </StackSpread>
      <div style={caption}>Hover a stack, or tab into it, to fan it apart. Escape gathers it again.</div>
    </div>
  );
}
