import { useEffect, useMemo, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { Artifact } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/** A small retention chart as an SVG data URL – the "image" the run produced */
function chart(points: number[], stroke: string) {
  const w = 480;
  const h = 260;
  const xs = points.map((_, i) => 40 + (i * (w - 60)) / (points.length - 1));
  const ys = points.map((p) => 30 + (1 - p) * (h - 70));
  const line = xs.map((x, i) => `${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const grid = [0, 0.25, 0.5, 0.75, 1].map((g) => `<line x1="40" x2="${w - 20}" y1="${30 + (1 - g) * (h - 70)}" y2="${30 + (1 - g) * (h - 70)}" stroke="#e5e5e5"/><text x="32" y="${34 + (1 - g) * (h - 70)}" font-size="11" text-anchor="end" fill="#737373" font-family="Inter, sans-serif">${g * 100}%</text>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#ffffff"/>${grid}<polyline points="${line}" fill="none" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>${xs.map((x, i) => `<circle cx="${x}" cy="${ys[i]}" r="3.5" fill="${stroke}"/>`).join("")}<text x="40" y="${h - 14}" font-size="11" fill="#737373" font-family="Inter, sans-serif">Week 0</text><text x="${w - 20}" y="${h - 14}" font-size="11" text-anchor="end" fill="#737373" font-family="Inter, sans-serif">Week 12</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const PLOT = `import pandas as pd
import matplotlib.pyplot as plt

# Weekly retention by signup cohort, Q3 only
events = pd.read_parquet("events.parquet")
cohorts = events.groupby(["cohort_week", "week"]).user_id.nunique()
retention = cohorts / cohorts.xs(0, level="week")

fig, ax = plt.subplots(figsize=(8, 4))
retention.groupby("week").mean().plot(ax=ax, marker="o")
ax.set_ylim(0, 1)
ax.set_title("Q3 retention by week since signup")
fig.savefig("retention-curve.png", dpi=200)
`;

const BASE: Artifact[] = [
  {
    id: "report",
    name: "churn-report.md",
    kind: "text",
    size: "2.1 KB",
    versions: [
      {
        id: "r1",
        time: "14 min ago",
        note: "First draft",
        content: "# Q3 churn report\n\nChurn rose to 4.1% in Q3, up from 3.2% in Q2. Most of the increase came from teams on the Starter plan that never invited a second member.\n\n## What we found\n\n- Starter teams with one member churn three times as often\n- Churn peaks in week 3, right after the trial ends\n- Annual plans were flat",
      },
      {
        id: "r2",
        time: "9 min ago",
        note: "Added the onboarding finding",
        content: "# Q3 churn report\n\nChurn rose to 4.1% in Q3, up from 3.2% in Q2. Most of the increase came from teams on the Starter plan that never invited a second member.\n\n## What we found\n\n- Starter teams with one member churn three times as often\n- Churn peaks in week 3, right after the trial ends\n- Teams that finish onboarding churn 40% less\n- Annual plans were flat",
      },
      {
        id: "r3",
        time: "2 min ago",
        note: "Tightened the summary",
        content: "# Q3 churn report\n\nChurn rose to 4.1% in Q3 (Q2: 3.2%). Nearly all of the increase is Starter teams that never invited a teammate.\n\n## What we found\n\n- Starter teams with one member churn three times as often\n- Churn peaks in week 3, right after the trial ends\n- Teams that finish onboarding churn 40% less\n- Annual plans were flat\n\n## Next step\n\nPrompt solo Starter teams to invite a teammate during the trial.",
      },
    ],
  },
  {
    id: "plot",
    name: "plot_retention.py",
    kind: "code",
    language: "py",
    size: "0.6 KB",
    versions: [],
  },
  {
    id: "table",
    name: "churn-by-plan.csv",
    kind: "table",
    size: "0.3 KB",
    versions: [
      {
        id: "t1",
        time: "12 min ago",
        content: { columns: ["Plan", "Teams", "Churned", "Churn"], rows: [["Starter", 1840, 101, "5.5%"], ["Team", 920, 28, "3.0%"], ["Business", 310, 6, "1.9%"]] },
      },
      {
        id: "t2",
        time: "6 min ago",
        note: "Split Starter by team size",
        content: {
          columns: ["Plan", "Teams", "Churned", "Churn"],
          rows: [["Starter · 1 member", 1210, 88, "7.3%"], ["Starter · 2+ members", 630, 13, "2.1%"], ["Team", 920, 28, "3.0%"], ["Business", 310, 6, "1.9%"]],
        },
      },
    ],
  },
  {
    id: "chart",
    name: "retention-curve.png",
    kind: "image",
    alt: "Line chart of weekly retention: it drops to about 62% by week 3, then flattens near 55%",
    size: "38 KB",
    versions: [
      { id: "c1", time: "8 min ago", content: chart([1, 0.82, 0.71, 0.63, 0.6, 0.58, 0.57], "#a3a3a3") },
      { id: "c2", time: "4 min ago", note: "Q3 cohorts only", content: chart([1, 0.8, 0.68, 0.62, 0.58, 0.56, 0.55], "#2f68ff") },
    ],
  },
];

const CHUNK = 22;
const TICK_MS = 70;

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ArtifactPanel } = ui;
  const [shown, setShown] = useState(0);
  const [log, setLog] = useState("");

  // The run is still writing its plotting script: it streams in, then the file is done
  useEffect(() => {
    const t = setInterval(() => {
      setShown((n) => {
        const next = Math.min(PLOT.length, n + CHUNK);
        if (next >= PLOT.length) clearInterval(t);
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(t);
  }, []);

  const writing = shown < PLOT.length;
  const artifacts = useMemo(
    () =>
      BASE.map((a) =>
        a.id === "plot"
          ? {
              ...a,
              status: writing ? ("writing" as const) : ("ready" as const),
              versions: [{ id: "p1", time: writing ? "now" : "just now", content: PLOT.slice(0, shown) }],
            }
          : a,
      ),
    [shown, writing],
  );

  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 10 }}>
      <ArtifactPanel
        title="Churn analysis · artifacts"
        artifacts={artifacts}
        defaultSelected="plot"
        previewHeight={300}
        onDownload={(a, v) => setLog(`Saved ${a.name} (${v.label ?? `v${a.versions.indexOf(v) + 1}`})`)}
      />
      <div style={{ ...caption, textAlign: "center", minHeight: 18 }}>{log || "Pick churn-report.md and press Compare to see what changed between versions."}</div>
    </div>
  );
}
