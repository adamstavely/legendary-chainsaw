import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { OpsHealth, OpsTile } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fictional fraud operations team's command overview: open cases, alerts, critical-risk accounts and resolution
   time, each with its change since last week. "Degrade a feed" turns the health pill amber; the tiles open the list
   behind them. */

const TILES: OpsTile[] = [
  { id: "cases", label: "Active cases", value: 12, change: 2, goodWhen: "none", sub: "across 3 teams", trend: [8, 9, 9, 10, 11, 10, 12] },
  { id: "ops", label: "Open investigations", value: 3, change: 1, goodWhen: "none", sub: "2 authorised" },
  { id: "alerts", label: "Alerts · 24h", value: 5, change: 4, goodWhen: "down", sub: "2 critical", trend: [2, 1, 3, 1, 2, 1, 5] },
  { id: "critical", label: "Critical risk", value: 3, change: 0, goodWhen: "down", tone: "danger", sub: "accounts" },
  { id: "resolve", label: "Median resolution", value: "1.8 d", change: -1, goodWhen: "down", sub: "was 2.2 days", trend: [2.6, 2.4, 2.5, 2.2, 2.1, 2, 1.8] },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { OpsOverview } = ui;
  const [health, setHealth] = useState<OpsHealth>("nominal");
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <div style={{ width: "100%", maxWidth: 820, display: "grid", gap: 8 }}>
      <OpsOverview
        title="Command overview"
        status={health === "nominal" ? "All operations active · 3 analysts on watch" : "Card-network feed is 12 minutes behind"}
        health={health}
        tiles={TILES}
        changeLabel="since last week"
        actionable
        onAction={(_, t) => setOpened(t.label)}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {opened ? `Opened ${opened}. ` : "Press a tile to open what it counts. "}
        <button type="button" style={textButton} onClick={() => setHealth(health === "nominal" ? "degraded" : "nominal")}>
          {health === "nominal" ? "Degrade a feed" : "Restore the feed"}
        </button>
      </div>
    </div>
  );
}
