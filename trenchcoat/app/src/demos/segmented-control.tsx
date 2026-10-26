import { useEffect, useId, useState } from "react";
import type * as UI from "@components/segmented-control";

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const LIST = "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01";
const GRID = "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z";
const BOARD = "M4 4h4v16H4zM10 4h4v10h-4zM16 4h4v13h-4z";

const panels: Record<string, string> = {
  overview: "Revenue is up 12% week over week, driven by annual plans.",
  activity: "Maya merged #482 · Jonas commented on “Q4 roadmap” · 3 new signups.",
  settings: "Workspace name, billing contact and data retention live here.",
};

const Label = ({ children }: { children: string }) => (
  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase", color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))" }}>{children}</div>
);

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SegmentedControl } = ui;
  const [inbox, setInbox] = useState("all");
  const [unread, setUnread] = useState(8);
  const [billing, setBilling] = useState("yearly");
  const [view, setView] = useState("list");
  const [tab, setTab] = useState("overview");
  const panelId = "seg-panel" + useId().replace(/[^a-zA-Z0-9_-]/g, "");

  // New mail arrives every few seconds, so the count – and the control's width – morphs
  useEffect(() => {
    const t = window.setInterval(() => setUnread((n) => (n >= 12 ? 3 : n + 1)), 2600);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div style={{ width: "100%", maxWidth: 440, display: "grid", gap: 22 }}>
      <div style={{ display: "grid", gap: 8, justifyItems: "start" }}>
        <Label>Tray with counts</Label>
        <SegmentedControl
          aria-label="Inbox filter"
          value={inbox}
          onChange={setInbox}
          options={[
            { value: "all", label: "All" },
            { value: "unread", label: "Unread", count: unread },
            { value: "mentions", label: "Mentions", count: 2 },
            { value: "archived", label: "Archived", disabled: true },
          ]}
        />
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <Label>Full width with a badge</Label>
        <SegmentedControl
          aria-label="Billing period"
          fullWidth
          size="lg"
          value={billing}
          onChange={setBilling}
          options={[
            { value: "monthly", label: "Monthly" },
            { value: "yearly", label: "Yearly", badge: "Save 20%" },
          ]}
        />
        <div style={{ fontSize: 13, color: "var(--tc-text-secondary, light-dark(#404040, #c8c8cc))" }}>{billing === "yearly" ? "$96 / year – billed annually" : "$10 / month"}</div>
      </div>

      <div style={{ display: "grid", gap: 8, justifyItems: "start" }}>
        <Label>Icons only, small</Label>
        <SegmentedControl
          aria-label="View"
          size="sm"
          value={view}
          onChange={setView}
          options={[
            { value: "list", icon: <Icon d={LIST} />, ariaLabel: "List" },
            { value: "grid", icon: <Icon d={GRID} />, ariaLabel: "Grid" },
            { value: "board", icon: <Icon d={BOARD} />, ariaLabel: "Board" },
          ]}
        />
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <Label>Underline tabs</Label>
        <SegmentedControl
          aria-label="Project sections"
          variant="underline"
          kind="tabs"
          value={tab}
          onChange={setTab}
          options={[
            { value: "overview", label: "Overview", controls: panelId },
            { value: "activity", label: "Activity", count: 3, controls: panelId },
            { value: "settings", label: "Settings", controls: panelId },
          ]}
        />
        <div id={panelId} role="tabpanel" style={{ fontSize: 13, color: "var(--tc-text-secondary, light-dark(#404040, #c8c8cc))", lineHeight: 1.5, minHeight: 40 }}>
          {panels[tab]}
        </div>
      </div>
    </div>
  );
}
